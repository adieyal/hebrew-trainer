import { afterEach, describe, expect, test } from "vitest";
import type { Attempt } from "../../domain/models/attempt";
import type { MistakeEntry } from "../../domain/models/mistake";
import type { PracticeSession } from "../../domain/models/session";
import type { AppSettings } from "../../domain/models/settings";
import { resetTrainerDb } from "../db";
import { attemptRepository } from "./attempt-repository";
import { mistakeRepository } from "./mistake-repository";
import { sessionRepository } from "./session-repository";
import { settingsRepository } from "./settings-repository";

afterEach(async () => {
  await resetTrainerDb();
});

const mistake: MistakeEntry = {
  id: "m1",
  englishPrompt: "Can you get here before one?",
  primaryTranslation: "אתה יכול להגיע לפני אחת?",
  acceptableTranslations: ["אתה יכול להגיע לפני אחת"],
  practiceRoots: ["להגיע", "אחת"],
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
};

const session: PracticeSession = {
  id: "s1",
  createdAt: "2026-03-07T10:00:00.000Z",
  requestedSize: 5,
  exerciseIds: ["e1"],
  currentIndex: 0,
};

const attempt: Attempt = {
  id: "a1",
  sessionId: "s1",
  exerciseId: "e1",
  mistakeIds: ["m1"],
  userAnswer: "מא איתך?",
  submittedAt: "2026-03-07T10:05:00.000Z",
  result: {
    isCorrect: false,
    score: 0.2,
    issues: [],
    feedbackSummary: "Wrong",
    correctedAnswer: "מה איתך?",
    shouldCreateDerivedMistake: false,
    verdictSource: "rule_based",
    semanticAccepted: false,
    naturalnessAccepted: false,
    targetedPatternHandled: false,
    mistakeAnalyses: [],
  },
};

const settings: AppSettings = {
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
};

describe("repositories", () => {
  test("saves and lists mistakes", async () => {
    await mistakeRepository.upsert(mistake);

    const mistakes = await mistakeRepository.list();

    expect(mistakes).toHaveLength(1);
    expect(mistakes[0]?.correctedText).toBe("מה איתך?");
    expect(mistakes[0]?.englishPrompt).toBe("Can you get here before one?");
    expect(mistakes[0]?.primaryTranslation).toBe("אתה יכול להגיע לפני אחת?");
    expect(mistakes[0]?.practiceRoots).toContain("אחת");
  });

  test("finds an existing mistake by english prompt and primary translation", async () => {
    await mistakeRepository.upsert(mistake);

    const saved = await mistakeRepository.findByPromptAndTranslation(
      "Can you get here before one?",
      "אתה יכול להגיע לפני אחת?",
    );

    expect(saved?.id).toBe("m1");
  });

  test("matches duplicate prompts even when spacing or terminal punctuation differs", async () => {
    await mistakeRepository.upsert(mistake);

    const saved = await mistakeRepository.findByPromptAndTranslation(
      "Can you get here before one?",
      "אתה יכול להגיע לפני אחת",
    );

    expect(saved?.id).toBe("m1");
  });

  test("saves sessions and attempts", async () => {
    await sessionRepository.save(session);
    await attemptRepository.save(attempt);

    const sessions = await sessionRepository.list();
    const attempts = await attemptRepository.listBySession("s1");

    expect(sessions).toHaveLength(1);
    expect(attempts).toHaveLength(1);
    expect(attempts[0]?.exerciseId).toBe("e1");
  });

  test("persists settings by singleton id", async () => {
    await settingsRepository.save(settings);

    const saved = await settingsRepository.get();

    expect(saved?.gradingMode).toBe("balanced");
    expect(saved?.gradingStrategy).toBe("rule_based_only");
    expect(saved?.llm.mode).toBe("disabled");
  });
});
