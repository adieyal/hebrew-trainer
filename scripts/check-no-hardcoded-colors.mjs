import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const COLOR_LITERAL_PATTERN = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g;

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

const stylesheetPath = resolve(process.cwd(), "src/styles.css");
const stylesheet = readFileSync(stylesheetPath, "utf8");
const { rules } = collectRules(stripComments(stylesheet));

const violations = [];

for (const rule of rules) {
  if (rule.selectors.length === 1 && rule.selectors[0] === ":root") {
    continue;
  }

  const matches = Array.from(rule.body.matchAll(COLOR_LITERAL_PATTERN)).map((match) => match[0]);
  if (matches.length === 0) {
    continue;
  }

  violations.push({
    atRule: rule.atRule,
    colors: matches,
    selector: rule.selector,
  });
}

if (violations.length > 0) {
  console.error("Hardcoded color values are forbidden outside :root token definitions.\n");
  for (const violation of violations) {
    const location = violation.atRule ? `${violation.selector} inside ${violation.atRule}` : violation.selector;
    console.error(`- ${location} -> ${violation.colors.join(", ")}`);
  }
  process.exit(1);
}

console.log("Hardcoded color guard passed.");
