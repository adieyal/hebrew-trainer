import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const TYPOGRAPHY_PROPERTIES = new Set([
  "color",
  "font",
  "font-family",
  "font-size",
  "font-weight",
  "letter-spacing",
  "line-height",
]);

const ALLOWED_SELECTOR_PATTERNS = [
  /^:root$/,
  /^html$/,
  /^button$/,
  /^input$/,
  /^textarea$/,
  /^select$/,
  /^a$/,
  /^\.type-[\w-]+$/,
  /^\.text-input$/,
  /^\.select-input$/,
  /^\.button$/,
  /^\.button--secondary$/,
  /^\.button--ghost$/,
  /^\.status-text--active$/,
  /^\.pill$/,
  /^\.detail-grid dd$/,
  /^\.feedback-issue p$/,
  /^\.feedback-highlight::after$/,
  /^\.teaching-highlight::after$/,
];

const VALUE_ALLOWLIST = [
  /^inherit$/,
];

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

function splitSelectors(selectorText) {
  return selectorText
    .split(",")
    .map((selector) => selector.trim())
    .filter(Boolean);
}

function isAllowedSelector(selector) {
  return ALLOWED_SELECTOR_PATTERNS.some((pattern) => pattern.test(selector));
}

function isTypographyDeclaration(property, value) {
  if (!TYPOGRAPHY_PROPERTIES.has(property)) {
    return false;
  }

  return !VALUE_ALLOWLIST.some((pattern) => pattern.test(value));
}

function collectRules(source, startIndex = 0, inheritedAtRule = "") {
  const rules = [];
  let index = startIndex;

  while (index < source.length) {
    while (index < source.length && /\s/.test(source[index])) {
      index += 1;
    }

    if (index >= source.length || source[index] === "}") {
      return { rules, index };
    }

    const selectorStart = index;
    while (index < source.length && source[index] !== "{") {
      index += 1;
    }

    if (index >= source.length) {
      break;
    }

    const selector = source.slice(selectorStart, index).trim();
    index += 1;

    let bodyStart = index;
    let depth = 1;

    while (index < source.length && depth > 0) {
      if (source[index] === "{") {
        depth += 1;
      } else if (source[index] === "}") {
        depth -= 1;
      }
      index += 1;
    }

    const body = source.slice(bodyStart, index - 1).trim();
    if (!selector) {
      continue;
    }

    if (selector.startsWith("@")) {
      const nested = collectRules(body, 0, selector);
      rules.push(...nested.rules);
      continue;
    }

    rules.push({
      atRule: inheritedAtRule,
      body,
      selector,
      selectors: splitSelectors(selector),
    });
  }

  return { rules, index };
}

function collectTypographyViolations(source) {
  const { rules } = collectRules(stripComments(source));
  const violations = [];

  for (const rule of rules) {
    const declarations = rule.body
      .split(";")
      .map((declaration) => declaration.trim())
      .filter(Boolean);

    const typographyDeclarations = declarations
      .map((declaration) => {
        const colonIndex = declaration.indexOf(":");
        if (colonIndex === -1) {
          return null;
        }

        const property = declaration.slice(0, colonIndex).trim().toLowerCase();
        const value = declaration.slice(colonIndex + 1).trim();
        return { property, value };
      })
      .filter(Boolean)
      .filter(({ property, value }) => isTypographyDeclaration(property, value));

    if (typographyDeclarations.length === 0) {
      continue;
    }

    for (const selector of rule.selectors) {
      if (isAllowedSelector(selector)) {
        continue;
      }

      violations.push({
        atRule: rule.atRule,
        declarations: typographyDeclarations,
        selector,
      });
    }
  }

  return violations;
}

const stylesheetPath = resolve(process.cwd(), "src/styles.css");
const stylesheet = readFileSync(stylesheetPath, "utf8");
const violations = collectTypographyViolations(stylesheet);

if (violations.length > 0) {
  console.error("Typography declarations must live in semantic type selectors or the approved exception list.\n");
  for (const violation of violations) {
    const location = violation.atRule ? `${violation.selector} inside ${violation.atRule}` : violation.selector;
    const details = violation.declarations
      .map(({ property, value }) => `${property}: ${value}`)
      .join(", ");
    console.error(`- ${location} -> ${details}`);
  }
  process.exit(1);
}

console.log("Typography selector guard passed.");
