import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

function splitSelectors(selectorText) {
  return selectorText
    .split(",")
    .map((selector) => selector.trim())
    .filter(Boolean);
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

    const bodyStart = index;
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

function isAllowedRadiusValue(value) {
  const normalized = value.trim();
  return (
    normalized.startsWith("var(") ||
    normalized === "inherit" ||
    normalized === "0"
  );
}

const stylesheetPath = resolve(process.cwd(), "src/styles.css");
const stylesheet = readFileSync(stylesheetPath, "utf8");
const { rules } = collectRules(stripComments(stylesheet));

const violations = [];

for (const rule of rules) {
  if (rule.selectors.length === 1 && rule.selectors[0] === ":root") {
    continue;
  }

  const declarations = rule.body
    .split(";")
    .map((declaration) => declaration.trim())
    .filter(Boolean);

  for (const declaration of declarations) {
    const colonIndex = declaration.indexOf(":");
    if (colonIndex === -1) {
      continue;
    }

    const property = declaration.slice(0, colonIndex).trim().toLowerCase();
    const value = declaration.slice(colonIndex + 1).trim();

    if (property !== "border-radius") {
      continue;
    }

    if (isAllowedRadiusValue(value)) {
      continue;
    }

    violations.push({
      atRule: rule.atRule,
      selector: rule.selector,
      value,
    });
  }
}

if (violations.length > 0) {
  console.error("Literal border-radius values are forbidden outside :root token definitions.\n");
  for (const violation of violations) {
    const location = violation.atRule ? `${violation.selector} inside ${violation.atRule}` : violation.selector;
    console.error(`- ${location} -> border-radius: ${violation.value}`);
  }
  process.exit(1);
}

console.log("Border-radius token guard passed.");
