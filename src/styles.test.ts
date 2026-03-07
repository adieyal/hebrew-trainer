// @ts-ignore: test reads the source stylesheet directly; app code does not use Node APIs here.
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

// @ts-ignore: process is available in the Vitest runtime used for this source-level assertion.
const styles = readFileSync(`${process.cwd()}/src/styles.css`, "utf8");

describe("styles", () => {
  test("defines token-backed semantic typography classes", () => {
    expect(styles).toMatch(/--font-size-display:/);
    expect(styles).toMatch(/--font-size-heading-lg:/);
    expect(styles).toMatch(/--font-size-body:/);
    expect(styles).toMatch(/--font-size-hebrew:/);
    expect(styles).toMatch(/--text-color-muted:/);
    expect(styles).toMatch(/--text-color-hebrew:/);
    expect(styles).toMatch(/--line-height-text:/);
    expect(styles).toMatch(/--font-hebrew-body:/);
    expect(styles).toMatch(/--font-weight-medium:/);
    expect(styles).toMatch(/\.type-display-hero\s*\{/);
    expect(styles).toMatch(/\.type-heading-lg\s*\{/);
    expect(styles).toMatch(/\.type-heading-md\s*\{/);
    expect(styles).toMatch(/\.type-body\s*\{/);
    expect(styles).toMatch(/\.type-body-muted\s*\{/);
    expect(styles).toMatch(/\.type-label\s*\{/);
    expect(styles).toMatch(/\.type-hebrew-body\s*\{/);
    expect(styles).toMatch(/\.type-hebrew-training\s*\{/);
  });

  test("keeps component selectors free of semantic typography ownership", () => {
    expect(styles).not.toMatch(/\.app-shell__header h1\s*\{[^}]*font-/s);
    expect(styles).not.toMatch(/\.app-shell__lede\s*\{[^}]*font-|\.app-shell__lede\s*\{[^}]*line-height:|\.app-shell__lede\s*\{[^}]*color:/s);
    expect(styles).not.toMatch(/\.eyebrow\s*\{[^}]*font-|\.eyebrow\s*\{[^}]*letter-spacing:|\.eyebrow\s*\{[^}]*text-transform:|\.eyebrow\s*\{[^}]*color:/s);
    expect(styles).not.toMatch(/\.page__intro h2\s*\{[^}]*font-|\.page__intro h2\s*\{[^}]*line-height:/s);
    expect(styles).not.toMatch(/\.section-heading h3\s*\{[^}]*font-|\.section-heading h3\s*\{[^}]*line-height:/s);
    expect(styles).not.toMatch(/\.field-label\s*\{[^}]*font-size:|\.field-label\s*\{[^}]*color:/s);
    expect(styles).not.toMatch(/\.status-text,\s*[^}]*font-size:|\.status-text,\s*[^}]*line-height:|\.status-text,\s*[^}]*color:/s);
    expect(styles).not.toMatch(/\.empty-state\s*\{[^}]*line-height:/s);
    expect(styles).not.toMatch(/\.practice-session-header__title\s*\{[^}]*font-|\.practice-session-header__title\s*\{[^}]*line-height:/s);
    expect(styles).not.toMatch(/\.practice-feedback__verdict\s*\{[^}]*font-|\.practice-feedback__verdict\s*\{[^}]*line-height:/s);
    expect(styles).not.toMatch(/\.practice-prompt__text\s*\{[^}]*font-|\.practice-prompt__text\s*\{[^}]*line-height:/s);
    expect(styles).not.toMatch(/\.mistake-snippet\s*\{[^}]*line-height:/s);
    expect(styles).not.toMatch(/\.mistake-snippet--strong\s*\{[^}]*font-family:|\.mistake-snippet--strong\s*\{[^}]*font-size:|\.mistake-snippet--strong\s*\{[^}]*line-height:/s);
    expect(styles).not.toMatch(/\.text-input--hebrew\s*\{[^}]*font-|\.text-input--hebrew\s*\{[^}]*line-height:|\.text-input--hebrew\s*\{[^}]*letter-spacing:/s);
    expect(styles).not.toMatch(/\.hebrew-text\s*\{[^}]*font-/s);
    expect(styles).not.toMatch(/\.hebrew-text--prompt\s*\{[^}]*font-/s);
    expect(styles).not.toMatch(/\.hebrew-text--supporting\s*\{[^}]*font-/s);
    expect(styles).not.toMatch(/\.hebrew-text--feedback\s*\{[^}]*font-/s);
    expect(styles).not.toMatch(/\.import-candidate-preview__copy\s*\{[^}]*line-height:|\.import-candidate-preview__copy\s*\{[^}]*color:/s);
    expect(styles).not.toMatch(/\.teaching-panel__copy\s*\{[^}]*line-height:|\.teaching-panel__copy\s*\{[^}]*color:/s);
  });
});
