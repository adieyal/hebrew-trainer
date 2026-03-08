// @ts-ignore: test reads source files directly; app code does not use Node APIs here.
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const viteConfigTs = readFileSync(`${process.cwd()}/vite.config.ts`, "utf8");
const viteConfigJs = readFileSync(`${process.cwd()}/vite.config.js`, "utf8");
let workflow = "";

try {
  workflow = readFileSync(`${process.cwd()}/.github/workflows/deploy-pages.yml`, "utf8");
} catch {
  workflow = "";
}

describe("GitHub Pages deployment config", () => {
  test("sets the Vite base path for the project page", () => {
    expect(viteConfigTs).toMatch(/base:\s*"\/hebrew-trainer\/"/);
    expect(viteConfigJs).toMatch(/base:\s*"\/hebrew-trainer\/"/);
  });

  test("defines a Pages workflow that builds and deploys dist", () => {
    expect(workflow).toMatch(/actions\/configure-pages@/);
    expect(workflow).toMatch(/npm ci/);
    expect(workflow).toMatch(/npm run build/);
    expect(workflow).toMatch(/path:\s*dist/);
    expect(workflow).toMatch(/actions\/deploy-pages@/);
  });
});
