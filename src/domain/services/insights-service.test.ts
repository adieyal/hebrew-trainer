import { describe, expect, test } from "vitest";
import { deriveInsights } from "./insights-service";
import type { Attempt } from "../models/attempt";
import type { MistakeEntry } from "../models/mistake";

const mistakes: MistakeEntry[] = [
  {
    id: "m1",
    sourceText: "מא איתך?",
    correctedText: "מה איתך?",
    wrongFragments: ["מא"],
    rightFragments: ["מה"],
    tags: ["common_word_spelling"],
    contexts: ["casual_text"],
    register: "casual",
    focusTokens: ["מה"],
    adjacentTokens: ["מה קורה"],
    createdAt: "2026-03-01T10:00:00.000Z",
    updatedAt: "2026-03-01T10:00:00.000Z",
    stats: {
      attempts: 2,
      correctCount: 1,
      streak: 0,
      relapseCount: 1,
      mastery: 0.5,
      masteryBand: "fragile",
      weaknessScore: 0.8,
      exposureCount: 2,
      recentFocuses: ["מה"],
      nextReviewAt: "2026-03-06T10:00:00.000Z",
    },
  },
  {
    id: "m2",
    englishPrompt: "I need to check with my spouse first.",
    primaryTranslation: "אני צריך קודם לבדוק עם בת הזוג שלי.",
    acceptableTranslations: ["אני צריך קודם לבדוק עם בת הזוג שלי."],
    practiceRoots: ["צריך", "לבדוק"],
    sourceText: "אני צריך לבדוק עם בת הזוג שלי קודם.",
    correctedText: "אני צריך קודם לבדוק עם בת הזוג שלי.",
    wrongFragments: ["לבדוק עם בת הזוג שלי קודם"],
    rightFragments: ["קודם לבדוק עם בת הזוג שלי"],
    tags: ["structure_error"],
    contexts: ["social"],
    register: "casual",
    focusTokens: ["צריך", "לבדוק"],
    adjacentTokens: ["בת הזוג שלי"],
    createdAt: "2026-03-01T10:00:00.000Z",
    updatedAt: "2026-03-01T10:00:00.000Z",
    stats: {
      attempts: 0,
      correctCount: 0,
      streak: 0,
      relapseCount: 0,
      mastery: 0,
      masteryBand: "new",
      weaknessScore: 1,
      exposureCount: 0,
      recentFocuses: ["צריך"],
    },
  },
  {
    id: "m3",
    englishPrompt: "First, I need to check with my spouse.",
    primaryTranslation: "אני קודם צריך לבדוק עם בת הזוג שלי.",
    acceptableTranslations: ["אני קודם צריך לבדוק עם בת הזוג שלי."],
    practiceRoots: ["צריך", "לבדוק"],
    sourceText: "אני קודם צריך לבדוק עם בת הזוג שלי.",
    correctedText: "אני קודם צריך לבדוק עם בת הזוג שלי.",
    wrongFragments: ["בתזוגשלי"],
    rightFragments: ["בת הזוג שלי"],
    tags: ["structure_error"],
    contexts: ["social"],
    register: "casual",
    focusTokens: ["צריך", "לבדוק"],
    adjacentTokens: ["בת הזוג שלי"],
    createdAt: "2026-03-01T10:05:00.000Z",
    updatedAt: "2026-03-01T10:05:00.000Z",
    derivedFrom: {
      source: "llm_remediation",
      attemptId: "a1",
      exerciseId: "e1",
      actualFragment: "בתזוגשלי",
      expectedFragment: "בת הזוג שלי",
    },
    stats: {
      attempts: 2,
      correctCount: 1,
      streak: 0,
      relapseCount: 1,
      mastery: 0.3,
      masteryBand: "fragile",
      weaknessScore: 0.8,
      exposureCount: 2,
      recentFocuses: ["צריך"],
    },
  },
];

const attempts: Attempt[] = [
  {
    id: "a1",
    sessionId: "s1",
    exerciseId: "e1",
    mistakeIds: ["m1"],
    userAnswer: "מא איתך?",
    submittedAt: "2026-03-05T10:00:00.000Z",
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
  },
];

describe("deriveInsights", () => {
  test("surfaces due counts, relapses, and weak categories", () => {
    const insights = deriveInsights(mistakes, attempts, "2026-03-07T10:00:00.000Z");

    expect(insights.totalMistakes).toBe(1);
    expect(insights.dueCount).toBe(1);
    expect(insights.relapsedCount).toBe(1);
    expect(insights.weakCategories[0]?.tag).toBe("common_word_spelling");
  });
});
