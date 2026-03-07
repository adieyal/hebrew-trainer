import { afterEach, describe, expect, test } from "vitest";
import { resetTrainerDb } from "../../storage/db";
import { mistakeRepository } from "../../storage/repositories/mistake-repository";
import { settingsRepository } from "../../storage/repositories/settings-repository";
import {
  clearTrainerProgress,
  exportTrainerData,
  importTrainerData,
  validateImportPayload,
} from "./export-service";

afterEach(async () => {
  await resetTrainerDb();
});

describe("export service", () => {
  test("exports and reimports app data", async () => {
    await mistakeRepository.upsert({
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
    });
    await settingsRepository.save({
      id: "app_settings",
      llm: { mode: "disabled" },
      typography: {
        practiceFontPreset: "assistant",
        customPracticeFont: "",
      },
      gradingMode: "balanced",
      gradingStrategy: "rule_based_only",
      defaultSessionLength: 5,
      createdAt: "2026-03-07T10:00:00.000Z",
      updatedAt: "2026-03-07T10:00:00.000Z",
    });

    const payload = await exportTrainerData("2026-03-07T12:00:00.000Z");

    expect(validateImportPayload(payload)).toBe(true);

    await resetTrainerDb();
    await importTrainerData(payload);

    const restored = await exportTrainerData("2026-03-07T13:00:00.000Z");
    expect(restored.mistakes).toHaveLength(1);
    expect(restored.settings?.defaultSessionLength).toBe(5);
  });

  test("rejects invalid payload shapes", () => {
    expect(validateImportPayload({ version: 2 })).toBe(false);
    expect(validateImportPayload(null)).toBe(false);
  });

  test("clears progress and history while preserving stored entries and settings", async () => {
    await mistakeRepository.upsert({
      id: "m1",
      englishPrompt: "How are you?",
      primaryTranslation: "מה איתך?",
      acceptableTranslations: ["מה איתך?"],
      practiceRoots: ["מה"],
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
        attempts: 4,
        correctCount: 2,
        streak: 1,
        relapseCount: 2,
        mastery: 0.4,
        masteryBand: "fragile",
        weaknessScore: 0.7,
        exposureCount: 4,
        recentFocuses: ["מה"],
        lastAttemptAt: "2026-03-07T12:00:00.000Z",
        nextReviewAt: "2026-03-10T12:00:00.000Z",
      },
    });
    await mistakeRepository.upsert({
      id: "m2",
      englishPrompt: "First, I need to check with my spouse.",
      primaryTranslation: "אני קודם צריך לבדוק עם בת הזוג שלי.",
      acceptableTranslations: ["אני קודם צריך לבדוק עם בת הזוג שלי."],
      practiceRoots: ["צריך", "לבדוק"],
      sourceText: "אני קודם צריך לבדוק עם בתזוגשלי",
      correctedText: "אני קודם צריך לבדוק עם בת הזוג שלי.",
      wrongFragments: ["בתזוגשלי"],
      rightFragments: ["בת הזוג שלי"],
      tags: ["structure_error"],
      contexts: ["social"],
      register: "casual",
      focusTokens: ["צריך", "לבדוק"],
      adjacentTokens: ["בת הזוג שלי"],
      createdAt: "2026-03-07T10:05:00.000Z",
      updatedAt: "2026-03-07T10:05:00.000Z",
      derivedFrom: {
        source: "llm_remediation",
        attemptId: "a1",
        exerciseId: "e1",
        actualFragment: "בתזוגשלי",
        expectedFragment: "בת הזוג שלי",
      },
      stats: {
        attempts: 3,
        correctCount: 1,
        streak: 0,
        relapseCount: 1,
        mastery: 0.3,
        masteryBand: "fragile",
        weaknessScore: 0.8,
        exposureCount: 3,
        recentFocuses: ["צריך"],
        lastAttemptAt: "2026-03-07T13:00:00.000Z",
        nextReviewAt: "2026-03-09T13:00:00.000Z",
      },
    });
    await settingsRepository.save({
      id: "app_settings",
      llm: { mode: "disabled" },
      typography: {
        practiceFontPreset: "assistant",
        customPracticeFont: "",
      },
      gradingMode: "balanced",
      gradingStrategy: "rule_based_only",
      defaultSessionLength: 5,
      createdAt: "2026-03-07T10:00:00.000Z",
      updatedAt: "2026-03-07T10:00:00.000Z",
    });

    await clearTrainerProgress();

    const exported = await exportTrainerData("2026-03-07T13:30:00.000Z");
    expect(exported.mistakes).toHaveLength(2);
    expect(exported.mistakes[0]?.stats.attempts).toBe(0);
    expect(exported.mistakes[0]?.stats.masteryBand).toBe("new");
    expect(exported.mistakes[0]?.stats.nextReviewAt).toBeUndefined();
    expect(exported.mistakes[1]?.derivedFrom?.source).toBe("llm_remediation");
    expect(exported.attempts).toHaveLength(0);
    expect(exported.sessions).toHaveLength(0);
    expect(exported.settings?.defaultSessionLength).toBe(5);
  });
});
