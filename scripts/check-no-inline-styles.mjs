import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { readdirSync, statSync } from "node:fs";

const ROOT = process.cwd();
const SEARCH_ROOTS = [join(ROOT, "src"), join(ROOT, "index.html")];
const FILE_EXTENSIONS = new Set([".ts", ".tsx", ".html"]);

function walk(pathname) {
  const stats = statSync(pathname);
  if (stats.isFile()) {
    return [pathname];
  }

  return readdirSync(pathname, { withFileTypes: true }).flatMap((entry) => {
    const childPath = join(pathname, entry.name);
    if (entry.isDirectory()) {
      return walk(childPath);
    }

    return [childPath];
  });
}

function shouldCheck(pathname) {
  for (const extension of FILE_EXTENSIONS) {
    if (pathname.endsWith(extension)) {
      return true;
    }
  }

  return false;
}

function findInlineStyleViolations(pathname) {
  const source = readFileSync(pathname, "utf8");
  const lines = source.split("\n");
  const violations = [];

  lines.forEach((line, index) => {
    if (/\bstyle\s*=\s*\{/.test(line) || /\bstyle\s*=\s*["']/.test(line)) {
      violations.push({
        line: index + 1,
        text: line.trim(),
      });
    }
  });

  return violations;
}

const files = SEARCH_ROOTS.flatMap((pathname) => walk(pathname)).filter(shouldCheck);
const violations = files.flatMap((pathname) =>
  findInlineStyleViolations(pathname).map((violation) => ({
    ...violation,
    file: relative(ROOT, pathname),
  })),
);

if (violations.length > 0) {
  console.error("Inline styles are forbidden. Use classes and stylesheet rules instead.\n");
  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line} -> ${violation.text}`);
  }
  process.exit(1);
}

console.log("Inline style guard passed.");
