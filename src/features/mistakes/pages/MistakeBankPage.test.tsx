import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { resetTrainerDb } from "../../../storage/db";
import { mistakeRepository } from "../../../storage/repositories/mistake-repository";
import { MistakeBankPage } from "./MistakeBankPage";

afterEach(async () => {
  await resetTrainerDb();
});

describe("MistakeBankPage", () => {
  test("counts only root mistake records, not generated remediation entries", async () => {
    await mistakeRepository.upsert({
      id: "m1",
      englishPrompt: "I need to check with my spouse first.",
      primaryTranslation: "אני צריך קודם לבדוק עם בת הזוג שלי.",
      acceptableTranslations: ["אני צריך קודם לבדוק עם בת הזוג שלי."],
      practiceRoots: ["צריך", "לבדוק"],
      sourceText: "אני קודם צריך לבדוק עם בתזוגשלי",
      correctedText: "אני צריך קודם לבדוק עם בת הזוג שלי.",
      wrongFragments: ["בתזוגשלי"],
      rightFragments: ["בת הזוג שלי"],
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

    render(<MistakeBankPage />);

    expect(await screen.findByText(/1 matching mistakes/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/i need to check with my spouse first\./i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText(/first, i need to check with my spouse\./i),
    ).not.toBeInTheDocument();
  });
});
