import { afterEach, describe, expect, test, vi } from "vitest";
import { createOpenAiCompatibleClient } from "./openai-client";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("createOpenAiCompatibleClient", () => {
  test("sends grading requests with json schema mode", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                isCorrect: true,
                score: 1,
                feedbackSummary: "Accurate.",
                correctedAnswer: "מה איתך?",
                teaching: {
                  yourAnswer: "מה איתך?",
                  betterAnswer: "מה איתך?",
                  whatChanged: "No wording change is needed.",
                  whyPreferred: "This version is already natural.",
                  why: "Your answer is already acceptable as written.",
                  anotherExample: "מה נשמע?",
                },
                semanticAccepted: true,
                naturalnessAccepted: true,
                targetedPatternHandled: true,
                issues: [],
                mistakeAnalyses: [
                  {
                    actualFragment: "מא",
                    expectedFragment: "מה",
                    issueCode: "spelling_error",
                    shortExplanation: "Use the standard spelling here.",
                    whyPreferred: "Hebrew uses מה for this common question word.",
                    practiceItems: [
                      {
                        englishPrompt: "What happened?",
                        primaryTranslation: "מה קרה?",
                        acceptableTranslations: ["מה קרה?"],
                        focusTokens: ["מה"],
                        practiceRoots: ["מה"],
                        register: "casual",
                        contexts: ["casual_text"],
                      },
                    ],
                  },
                ],
              }),
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createOpenAiCompatibleClient({
      apiKey: "secret",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-5-mini",
    });

    await client.gradeAnswer({
      prompt: "Translate this naturally",
      referenceAnswer: "מה איתך?",
      acceptableAnswers: ["מה איתך?"],
      userAnswer: "מה איתך?",
      meaningIntent: "ask how someone is doing",
      focusTokens: ["מה"],
      practiceRoots: ["מה"],
      explanation: "Use a natural casual phrasing.",
    });

    const [, request] = fetchMock.mock.calls[0] ?? [];
    const body = JSON.parse(String(request?.body)) as {
      response_format?: { type: string; json_schema?: { name: string } };
    };
    expect(body.response_format?.type).toBe("json_schema");
    expect(body.response_format?.json_schema?.name).toBe("grade_answer");
  });

  test("parses mistake analyses with generated practice items from grading", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                isCorrect: false,
                score: 0.44,
                feedbackSummary: "Two targeted mistakes remain.",
                correctedAnswer: "אני קצת עייף היום, לא אשקר.",
                teaching: {
                  yourAnswer: "אני לא אשקר, אני היף היום",
                  betterAnswer: "אני קצת עייף היום, לא אשקר.",
                  whatChanged: "The wording was adjusted around the softener and word order.",
                  whyPreferred: "Hebrew prefers the softer construction and later placement here.",
                  why: "The meaning was clear, but the phrasing stayed too close to English.",
                  anotherExample: "אני קצת לחוץ היום, לא אשקר.",
                },
                semanticAccepted: true,
                naturalnessAccepted: false,
                targetedPatternHandled: false,
                issues: [
                  {
                    code: "wrong_fragment",
                    message: "Use the natural softener here.",
                    expectedFragment: "קצת",
                    actualFragment: "",
                  },
                ],
                mistakeAnalyses: [
                  {
                    actualFragment: "היף",
                    expectedFragment: "עייף",
                    issueCode: "spelling_error",
                    shortExplanation: "The adjective is misspelled.",
                    whyPreferred: "עייף is the standard form for 'tired'.",
                    practiceItems: [
                      {
                        englishPrompt: "I am tired today.",
                        primaryTranslation: "אני עייף היום.",
                        acceptableTranslations: ["אני עייף היום"],
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
                    whyPreferred: "Hebrew prefers the softener inside the sentence and the aside later.",
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
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createOpenAiCompatibleClient({
      apiKey: "secret",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-5-mini",
    });

    const result = await client.gradeAnswer({
      prompt: "Translate this naturally",
      referenceAnswer: "אני קצת עייף היום, לא אשקר.",
      acceptableAnswers: ["אני קצת עייף היום, לא אשקר."],
      userAnswer: "אני לא אשקר, אני היף היום",
      meaningIntent: "say that you are a bit tired today",
      focusTokens: ["קצת", "עייף"],
      practiceRoots: ["קצת", "עייף"],
      explanation: "Use a natural softener and natural word order.",
    });

    expect(result.mistakeAnalyses).toHaveLength(2);
    expect(result.mistakeAnalyses[0]?.practiceItems[0]?.englishPrompt).toBe(
      "I am tired today.",
    );
    expect(result.mistakeAnalyses[1]?.practiceItems[0]?.primaryTranslation).toContain(
      "אני קצת לחוץ היום",
    );
  });

  test("falls back to prompt-only json when schema mode is rejected", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "response_format not supported",
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  primaryTranslation: "אתה יכול להגיע לפני אחת?",
                  acceptableTranslations: ["אתה יכול להגיע לפני אחת?"],
                  focusTokens: ["להגיע", "אחת"],
                  practiceRoots: ["להגיע", "אחת"],
                  register: "casual",
                  contexts: ["scheduling"],
                  ruleNote: "Use the natural Hebrew phrasing.",
                }),
              },
            },
          ],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const client = createOpenAiCompatibleClient({
      apiKey: "secret",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-5-mini",
    });

    const result = await client.generateTranslationReference({
      englishPrompt: "Can you get here before one?",
      register: "casual",
      contexts: ["scheduling"],
    });

    expect(result.primaryTranslation).toBe("אתה יכול להגיע לפני אחת?");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [, firstRequest] = fetchMock.mock.calls[0] ?? [];
    const [, secondRequest] = fetchMock.mock.calls[1] ?? [];
    const firstBody = JSON.parse(String(firstRequest?.body)) as {
      response_format?: { type: string };
    };
    const secondBody = JSON.parse(String(secondRequest?.body)) as {
      response_format?: { type: string };
    };

    expect(firstBody.response_format?.type).toBe("json_schema");
    expect(secondBody.response_format).toBeUndefined();
  });
});
