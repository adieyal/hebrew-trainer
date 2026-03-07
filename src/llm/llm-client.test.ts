import { describe, expect, test } from "vitest";
import { buildGradeAnswerPrompt } from "./prompts/grade-answer";
import { buildGenerateTranslationReferencePrompt } from "./prompts/generate-translation-reference";
import { buildGenerateVariationPrompt } from "./prompts/generate-variation";

describe("llm prompts", () => {
  test("builds a grading prompt with the expected fields", () => {
    const prompt = buildGradeAnswerPrompt({
      prompt: "Write this naturally",
      referenceAnswer: "מה איתך?",
      acceptableAnswers: [],
      userAnswer: "מה נשמע?",
      meaningIntent: "ask how someone is doing",
      focusTokens: ["מה"],
      practiceRoots: ["מה"],
      explanation: "Use the common interrogative spelling.",
    });

    expect(prompt).toContain("Reference answer: מה איתך?");
    expect(prompt).toContain("Focus tokens");
    expect(prompt).toContain("whatChanged");
    expect(prompt).toContain("whyPreferred");
    expect(prompt).toContain("mistakeAnalyses");
    expect(prompt).toContain("practiceItems");
    expect(prompt).toContain("English prompt");
    expect(prompt).toContain("primary Hebrew reference");
    expect(prompt).toContain("Write all explanations in English");
  });

  test("builds a variation prompt around the weak form", () => {
    const prompt = buildGenerateVariationPrompt({
      count: 2,
      preferredTypes: ["context_response"],
      mistake: {
        id: "m1",
        sourceText: "מא איתך?",
        correctedText: "מה איתך?",
        wrongFragments: ["מא"],
        rightFragments: ["מה"],
        tags: ["common_word_spelling"],
        contexts: ["casual_text"],
        register: "casual",
        focusTokens: ["מה"],
        adjacentTokens: ["מה נשמע"],
        createdAt: "2026-03-07T10:00:00.000Z",
        updatedAt: "2026-03-07T10:00:00.000Z",
        stats: {
          attempts: 0,
          correctCount: 0,
          streak: 0,
          relapseCount: 0,
          mastery: 0,
          masteryBand: "new",
          weaknessScore: 1,
          exposureCount: 0,
          recentFocuses: ["מה"],
        },
      },
    });

    expect(prompt).toContain("Corrected text: מה איתך?");
    expect(prompt).toContain("Preserve the same learning target");
  });

  test("builds a translation reference prompt from english", () => {
    const prompt = buildGenerateTranslationReferencePrompt({
      englishPrompt: "Can you get here before one?",
      register: "casual",
      contexts: ["scheduling"],
    });

    expect(prompt).toContain("English prompt: Can you get here before one?");
    expect(prompt).toContain("primaryTranslation");
    expect(prompt).toContain("acceptableTranslations");
  });
});
