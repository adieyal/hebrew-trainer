import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { resetTrainerDb } from "../../../storage/db";
import { attemptRepository } from "../../../storage/repositories/attempt-repository";
import { mistakeRepository } from "../../../storage/repositories/mistake-repository";
import { InsightsPage } from "./InsightsPage";

afterEach(async () => {
  await resetTrainerDb();
});

describe("InsightsPage", () => {
  test("renders weak categories from stored attempts", async () => {
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
        attempts: 2,
        correctCount: 1,
        streak: 0,
        relapseCount: 1,
        mastery: 0.5,
        masteryBand: "fragile",
        weaknessScore: 0.8,
        exposureCount: 2,
        recentFocuses: ["מה"],
      },
    });
    await attemptRepository.save({
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
    });

    render(<InsightsPage />);

    expect(await screen.findByText(/common word spelling/i)).toBeInTheDocument();
    expect(screen.getByText(/practiced mistakes/i)).toBeInTheDocument();
  });

  test("does not count unpracticed bank entries as practiced mistakes", async () => {
    await mistakeRepository.upsert({
      id: "m1",
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
        recentFocuses: ["צריך"],
      },
    });

    render(<InsightsPage />);

    const practicedCardLabel = await screen.findByText(/practiced mistakes/i);
    const practicedCard = practicedCardLabel.closest(".metric-card");
    expect(practicedCard).toBeTruthy();
    expect(within(practicedCard as HTMLElement).getByText(/^0$/)).toBeInTheDocument();
    expect(screen.getByText(/no weak categories yet/i)).toBeInTheDocument();
  });
});
