import { describe, expect, test } from "vitest";
import { applyAttemptToMistake } from "./spaced-repetition-service";
import type { MistakeEntry } from "../models/mistake";

const mistake: MistakeEntry = {
  id: "mistake_1",
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
    attempts: 2,
    correctCount: 2,
    streak: 2,
    relapseCount: 0,
    mastery: 1,
    masteryBand: "solid",
    weaknessScore: 0.25,
    exposureCount: 2,
    recentFocuses: ["מה"],
  },
};

describe("applyAttemptToMistake", () => {
  test("increments relapse count after a broken streak", () => {
    const nextMistake = applyAttemptToMistake(
      mistake,
      {
        isCorrect: false,
        score: 0.4,
        issues: [],
        feedbackSummary: "Try again",
        correctedAnswer: mistake.correctedText,
        shouldCreateDerivedMistake: false,
        mistakeAnalyses: [],
      },
      "2026-03-08T10:00:00.000Z",
    );

    expect(nextMistake.stats.relapseCount).toBe(1);
    expect(nextMistake.stats.masteryBand).toBe("building");
    expect(nextMistake.stats.weaknessScore).toBeGreaterThan(mistake.stats.weaknessScore);
  });
});
