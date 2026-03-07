import { describe, expect, test } from "vitest";
import { selectPracticeMistakes } from "./adaptive-practice-service";
import type { MistakeEntry } from "../models/mistake";

const dueWeakMistake: MistakeEntry = {
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
  createdAt: "2026-03-01T10:00:00.000Z",
  updatedAt: "2026-03-01T10:00:00.000Z",
  stats: {
    attempts: 2,
    correctCount: 1,
    streak: 0,
    relapseCount: 1,
    mastery: 0.5,
    masteryBand: "fragile",
    weaknessScore: 0.9,
    exposureCount: 1,
    recentFocuses: ["מה"],
    nextReviewAt: "2026-03-06T10:00:00.000Z",
  },
};

const strongerOverusedMistake: MistakeEntry = {
  ...dueWeakMistake,
  id: "m2",
  correctedText: "אני חושב שהוא יגיע",
  focusTokens: ["שהוא"],
  adjacentTokens: ["אני חושב שהוא"],
  stats: {
    ...dueWeakMistake.stats,
    weaknessScore: 0.7,
    exposureCount: 8,
    recentFocuses: ["שהוא"],
    nextReviewAt: "2026-03-08T10:00:00.000Z",
  },
};

describe("selectPracticeMistakes", () => {
  test("prefers due weak items over recently overused ones", () => {
    const selected = selectPracticeMistakes(
      [strongerOverusedMistake, dueWeakMistake],
      1,
      "2026-03-07T10:00:00.000Z",
    );

    expect(selected[0]?.id).toBe("m1");
  });
});
