import { describe, expect, test } from "vitest";
import {
  generateExerciseFromMistake,
  generatePracticeSet,
  generateVariationPool,
} from "./exercise-generation-service";
import type { MistakeEntry } from "../models/mistake";

const baseMistake: MistakeEntry = {
  id: "mistake_1",
  englishPrompt: "Can you get here before one?",
  primaryTranslation: "אתה יכול להגיע לפני אחת?",
  acceptableTranslations: ["אתה יכול להגיע לפני אחת?", "אפשר להגיע לפני אחת?"],
  practiceRoots: ["להגיע", "אחת"],
  sourceText: "אתה יכול לגיע לפני אחד?",
  correctedText: "אתה יכול להגיע לפני אחת?",
  wrongFragments: ["לגיע", "אחד"],
  rightFragments: ["להגיע", "אחת"],
  tags: ["time_expression", "gender_number"],
  contexts: ["scheduling"],
  register: "casual",
  ruleNote: "Use the feminine form for clock time.",
  focusTokens: ["אחת"],
  adjacentTokens: ["לפני אחת", "בשעה אחת"],
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
    recentFocuses: ["אחת"],
  },
};

describe("generateExerciseFromMistake", () => {
  test("creates a translation exercise from an english prompt", () => {
    const exercise = generateExerciseFromMistake(baseMistake);

    expect(exercise.type).toBe("translate_to_hebrew");
    expect(exercise.targetAnswer).toBe(baseMistake.correctedText);
    expect(exercise.presentedText).toBe("Can you get here before one?");
    expect(exercise.acceptableAnswers).toContain("אפשר להגיע לפני אחת?");
    expect(exercise.allowsFreeVariation).toBe(true);
    expect(exercise.focusTokens).toContain("אחת");
  });

  test("builds a wider variation pool for the same weak form", () => {
    const pool = generateVariationPool(baseMistake, 4);

    expect(pool).toHaveLength(4);
    expect(new Set(pool.map((exercise) => exercise.prompt)).size).toBeGreaterThan(1);
  });

  test("interleaves different mistake families before repeating variants", () => {
    const secondMistake: MistakeEntry = {
      ...baseMistake,
      id: "mistake_2",
      sourceText: "אני חושב הוא כבר יצא",
      correctedText: "אני חושב שהוא כבר יצא",
      wrongFragments: ["הוא"],
      rightFragments: ["שהוא"],
      tags: ["connector_omission"],
      contexts: ["casual_text"],
      focusTokens: ["שהוא"],
      adjacentTokens: ["אני חושב שהוא", "הוא אמר שהוא"],
      stats: {
        ...baseMistake.stats,
        recentFocuses: ["שהוא"],
      },
    };

    const practiceSet = generatePracticeSet([baseMistake, secondMistake], 4);

    expect(practiceSet).toHaveLength(4);
    expect(practiceSet[0]?.sourceMistakeIds).toEqual(["mistake_1"]);
    expect(practiceSet[1]?.sourceMistakeIds).toEqual(["mistake_2"]);
  });
});
