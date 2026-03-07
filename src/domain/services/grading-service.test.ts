import { describe, expect, test, vi } from "vitest";
import { gradeExerciseAnswer } from "./grading-service";
import type { Exercise } from "../models/exercise";

const exercise: Exercise = {
  id: "exercise_1",
  type: "minimal_pair",
  prompt: "Type the full sentence using the correct form.",
  targetAnswer: "אתה יכול להגיע לפני אחת?",
  acceptableAnswers: ["אתה יכול להגיע לפני אחת"],
  meaningIntent: "ask whether someone can arrive before one o'clock",
  focusTokens: ["אחת"],
  practiceRoots: ["אחת", "להגיע"],
  allowsFreeVariation: true,
  explanation: "Use the feminine form for clock time.",
  reminders: [],
  relatedExamples: [],
  sourceMistakeIds: ["mistake_1"],
  difficulty: 2,
};

describe("gradeExerciseAnswer", () => {
  test("accepts exact matches", async () => {
    const result = await gradeExerciseAnswer(exercise, "אתה יכול להגיע לפני אחת?");

    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(1);
    expect(result.teaching?.betterAnswer).toBe(exercise.targetAnswer);
  });

  test("accepts punctuation-tolerant variants in balanced mode", async () => {
    const result = await gradeExerciseAnswer(exercise, "אתה יכול להגיע לפני אחת");

    expect(result.isCorrect).toBe(true);
    expect(result.score).toBeGreaterThan(0.9);
  });

  test("returns localized feedback for wrong focus tokens", async () => {
    const result = await gradeExerciseAnswer(exercise, "אתה יכול להגיע לפני אחד?");

    expect(result.isCorrect).toBe(false);
    expect(result.issues[0]?.expectedFragment).toBe("אחת?");
    expect(result.feedbackSummary).toContain("Expected");
    expect(result.teaching?.why).toContain("feminine form for clock time");
    expect(result.mistakeAnalyses).toEqual([]);
  });

  test("accepts alternate wording in llm-led mode", async () => {
    const llmClient = {
      gradeAnswer: vi.fn().mockResolvedValue({
        isCorrect: true,
        score: 0.91,
        feedbackSummary: "Accepted. Different wording, but the meaning and target form work.",
        correctedAnswer: exercise.targetAnswer,
        teaching: {
          yourAnswer: "אפשר להגיע לפני אחת?",
          betterAnswer: exercise.targetAnswer,
          whatChanged: "The wording shifts from a bare question to a fuller sentence.",
          whyPreferred: "The fuller sentence matches the practice target more closely.",
          why: "Your sentence is acceptable, but keep the time form feminine.",
          anotherExample: "אני יכול להגיע לפני אחת אם זה מתאים.",
        },
        semanticAccepted: true,
        naturalnessAccepted: true,
        targetedPatternHandled: true,
        issues: [],
        mistakeAnalyses: [],
      }),
      generateVariationExercises: vi.fn(),
      generateTranslationReference: vi.fn(),
    };

    const result = await gradeExerciseAnswer(exercise, "אפשר להגיע לפני אחת?", {
      gradingStrategy: "llm_led",
      llmClient,
    });

    expect(result.isCorrect).toBe(true);
    expect(result.verdictSource).toBe("llm");
    expect(result.acceptedVariantType).toBe("llm_equivalent");
    expect(result.teaching?.anotherExample).toContain("לפני אחת");
  });

  test("normalizes llm teaching when the better answer matches the user answer", async () => {
    const llmClient = {
      gradeAnswer: vi.fn().mockResolvedValue({
        isCorrect: true,
        score: 1,
        feedbackSummary: "Accurate.",
        correctedAnswer: "היא אמרה שהיא תבדוק אם אפשר לקצר את התהליך",
        teaching: {
          yourAnswer: "היא אמרה שהיא תבדוק אם אפשר לקצר את התהליך",
          betterAnswer: "היא אמרה שהיא תבדוק אם אפשר לקצר את התהליך",
          whatChanged: "No wording change is needed.",
          whyPreferred: "This form is already natural.",
          why: "This is better because...",
          anotherExample: "הוא אמר שהוא יגיע מחר.",
        },
        semanticAccepted: true,
        naturalnessAccepted: true,
        targetedPatternHandled: true,
        issues: [],
        mistakeAnalyses: [],
      }),
      generateVariationExercises: vi.fn(),
      generateTranslationReference: vi.fn(),
    };

    const result = await gradeExerciseAnswer(
      {
        ...exercise,
        targetAnswer: "היא אמרה שהיא תבדוק אם אפשר לקצר את התהליך",
      },
      "היא אמרה שהיא תבדוק אם אפשר לקצר את התהליך",
      {
        gradingStrategy: "llm_led",
        llmClient,
      },
    );

    expect(result.teaching?.why).toContain("already acceptable");
    expect(result.teaching?.whatChanged).toContain("No wording change");
  });

  test("preserves llm mistake analyses for specific fragments", async () => {
    const llmClient = {
      gradeAnswer: vi.fn().mockResolvedValue({
        isCorrect: false,
        score: 0.46,
        feedbackSummary: "Two targeted mistakes remain.",
        correctedAnswer: "אני קצת עייף היום, לא אשקר.",
        teaching: {
          yourAnswer: "אני לא אשקר, אני היף היום",
          betterAnswer: "אני קצת עייף היום, לא אשקר.",
          whatChanged: "The wording was adjusted around the softener and the misspelling.",
          whyPreferred: "Hebrew prefers the softer construction and standard spelling.",
          why: "The meaning was clear, but two targeted issues remain.",
          anotherExample: "אני קצת לחוץ היום, לא אשקר.",
        },
        semanticAccepted: true,
        naturalnessAccepted: false,
        targetedPatternHandled: false,
        issues: [
          {
            code: "spelling_error",
            message: "The adjective is misspelled.",
            expectedFragment: "עייף",
            actualFragment: "היף",
          },
        ],
        mistakeAnalyses: [
          {
            actualFragment: "היף",
            expectedFragment: "עייף",
            issueCode: "spelling_error",
            shortExplanation: "The adjective is misspelled.",
            whyPreferred: "עייף is the standard adjective here.",
            practiceItems: [
              {
                englishPrompt: "I am tired today.",
                primaryTranslation: "אני עייף היום.",
                acceptableTranslations: ["אני עייף היום."],
                focusTokens: ["עייף"],
                practiceRoots: ["עייף"],
                register: "casual",
                contexts: ["casual_text"],
              },
            ],
          },
          {
            actualFragment: "אני לא אשקר, אני",
            expectedFragment: "אני קצת עייף היום, לא אשקר",
            issueCode: "structure_error",
            shortExplanation: "The sentence follows English order too closely.",
            whyPreferred: "Hebrew prefers the aside later in the sentence.",
            practiceItems: [
              {
                englishPrompt: "I am a bit nervous today, not going to lie.",
                primaryTranslation: "אני קצת לחוץ היום, לא אשקר.",
                acceptableTranslations: ["אני קצת לחוץ היום, לא אשקר."],
                focusTokens: ["קצת", "לא אשקר"],
                practiceRoots: ["קצת", "אשקר"],
                register: "casual",
                contexts: ["social"],
              },
            ],
          },
        ],
      }),
      generateVariationExercises: vi.fn(),
      generateTranslationReference: vi.fn(),
    };

    const result = await gradeExerciseAnswer(exercise, "אני לא אשקר, אני היף היום", {
      gradingStrategy: "llm_led",
      llmClient,
    });

    expect(result.mistakeAnalyses).toHaveLength(2);
    expect(result.mistakeAnalyses[0]?.expectedFragment).toBe("עייף");
    expect(result.mistakeAnalyses[1]?.practiceItems[0]?.englishPrompt).toContain(
      "nervous today",
    );
  });

  test("replaces Hebrew-heavy explanation prose with English fallback copy", async () => {
    const llmClient = {
      gradeAnswer: vi.fn().mockResolvedValue({
        isCorrect: false,
        score: 0.46,
        feedbackSummary: "Two targeted mistakes remain.",
        correctedAnswer: "אני קצת עייף היום, לא אשקר.",
        teaching: {
          yourAnswer: "אני לא אשקר, אני היף היום",
          betterAnswer: "אני קצת עייף היום, לא אשקר.",
          whatChanged: "שיניתי את סדר המילים והוספתי קצת.",
          whyPreferred: "בעברית זה נשמע טבעי יותר ככה.",
          why: "ככה זה יותר נכון בעברית.",
          anotherExample: "אני קצת לחוץ היום, לא אשקר.",
        },
        semanticAccepted: true,
        naturalnessAccepted: false,
        targetedPatternHandled: false,
        issues: [
          {
            code: "structure_error",
            message: "The sentence follows English order too closely.",
            expectedFragment: "אני קצת עייף היום, לא אשקר",
            actualFragment: "אני לא אשקר, אני",
          },
        ],
        mistakeAnalyses: [],
      }),
      generateVariationExercises: vi.fn(),
      generateTranslationReference: vi.fn(),
    };

    const result = await gradeExerciseAnswer(exercise, "אני לא אשקר, אני היף היום", {
      gradingStrategy: "llm_led",
      llmClient,
    });

    expect(result.teaching?.whatChanged).toContain("The sentence was adjusted");
    expect(result.teaching?.whyPreferred).toContain("revised version");
    expect(result.teaching?.why).toContain("meaning");
  });
});
