import { afterEach, describe, expect, test, vi } from "vitest";
import type { AppSettings } from "../../domain/models/settings";
import type { MistakeEntry } from "../../domain/models/mistake";
import { buildPracticeExercises } from "./practice-variation-service";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const settings: AppSettings = {
  id: "app_settings",
  llm: {
    mode: "disabled",
    apiKey: "",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-5-mini",
  },
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

function createMistake(
  id: string,
  englishPrompt: string,
  sourceText: string,
  correctedText: string,
  focusTokens: string[],
): MistakeEntry {
  return {
    id,
    englishPrompt,
    primaryTranslation: correctedText,
    acceptableTranslations: [correctedText],
    practiceRoots: focusTokens,
    sourceText,
    correctedText,
    wrongFragments: [sourceText],
    rightFragments: [correctedText],
    tags: ["connector_omission"],
    contexts: ["casual_text"],
    register: "casual",
    focusTokens,
    adjacentTokens: [correctedText],
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
      recentFocuses: focusTokens,
    },
  };
}

describe("buildPracticeExercises", () => {
  test("returns an interleaved practice set when llm generation is disabled", async () => {
    const mistakes = [
      createMistake("m1", "I think he already left.", "אני חושב הוא כבר יצא", "אני חושב שהוא כבר יצא", ["שהוא"]),
      createMistake("m2", "What is going on with you?", "מא קורה איתך", "מה קורה איתך", ["מה"]),
      createMistake("m3", "We will start at one.", "בשעה אחד נתחיל", "בשעה אחת נתחיל", ["אחת"]),
    ];

    const exercises = await buildPracticeExercises(mistakes, 3, settings);

    expect(exercises).toHaveLength(3);
    expect(exercises.map((exercise) => exercise.sourceMistakeIds[0])).toEqual(["m1", "m2", "m3"]);
    expect(exercises[0]?.presentedText).toBe("I think he already left.");
  });

  test("keeps llm-generated variations but still falls back to a broad pool", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify([
                  {
                    id: "llm_1",
                    type: "context_response",
                    prompt: "Write a new sentence with שהוא.",
                    targetAnswer: "אני בטוח שהוא יגיע בזמן",
                    acceptableAnswers: [],
                    meaningIntent: "Use שהוא naturally.",
                    focusTokens: ["שהוא"],
                    practiceRoots: ["שהוא"],
                    allowsFreeVariation: true,
                    explanation: "Use the connector naturally.",
                    reminders: [],
                    relatedExamples: ["אני חושב שהוא מוכן"],
                    sourceMistakeIds: ["m1"],
                    difficulty: 2,
                  },
                ]),
              },
            },
          ],
        }),
      }),
    );

    const llmSettings: AppSettings = {
      ...settings,
      gradingStrategy: "llm_led",
      llm: {
        mode: "enhanced",
        apiKey: "secret",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-5-mini",
      },
    };

    const exercises = await buildPracticeExercises(
      [createMistake("m1", "I think he already left.", "אני חושב הוא כבר יצא", "אני חושב שהוא כבר יצא", ["שהוא"])],
      2,
      llmSettings,
    );

    expect(exercises).toHaveLength(2);
    expect(exercises[0]?.id).toBe("llm_1");
  });
});
