import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { resetTrainerDb } from "../../../storage/db";
import { mistakeRepository } from "../../../storage/repositories/mistake-repository";
import { settingsRepository } from "../../../storage/repositories/settings-repository";
import { PracticePage } from "./PracticePage";

afterEach(async () => {
  await resetTrainerDb();
  vi.restoreAllMocks();
});

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe("PracticePage", () => {
  test("starts a session and grades an answer", async () => {
    await mistakeRepository.upsert({
      id: "m1",
      englishPrompt: "How are you?",
      primaryTranslation: "מה איתך?",
      acceptableTranslations: ["מה איתך?", "מה נשמע?"],
      practiceRoots: ["מה"],
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
    });

    const user = userEvent.setup();
    render(<PracticePage />);

    expect(await screen.findByText(/how are you\?/i)).toBeInTheDocument();
    await user.type(await screen.findByLabelText(/type in hebrew/i), "מה איתך?");
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(await screen.findByText(/strong/i)).toBeInTheDocument();
  });

  test("shows the focused session header and compact answer label", async () => {
    await mistakeRepository.upsert({
      id: "m1",
      englishPrompt: "How are you?",
      primaryTranslation: "מה איתך?",
      acceptableTranslations: ["מה איתך?", "מה נשמע?"],
      practiceRoots: ["מה"],
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
    });

    render(<PracticePage />);

    expect(await screen.findByText(/focused writing session/i)).toBeInTheDocument();
    expect(await screen.findByText(/translate to natural hebrew/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/type in hebrew/i)).toBeInTheDocument();
  });

  test("shows a loading state during llm grading and clamps score presentation", async () => {
    await mistakeRepository.upsert({
      id: "m1",
      englishPrompt: "Thanks for arranging for Catherine to come sit in the office at Bar-Ilan.",
      primaryTranslation: "תודה שארגנת שקתרין תבוא לשבת במשרד בבר-אילן",
      acceptableTranslations: ["תודה שארגנת שקתרין תבוא לשבת במשרד בבר-אילן"],
      practiceRoots: ["לשבת", "בר-אילן"],
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
    });
    await settingsRepository.save({
      id: "app_settings",
      llm: {
        mode: "enhanced",
        apiKey: "secret",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-5-mini",
      },
      typography: {
        practiceFontPreset: "assistant",
        customPracticeFont: "",
      },
      gradingMode: "balanced",
      gradingStrategy: "llm_led",
      defaultSessionLength: 5,
      createdAt: "2026-03-07T10:00:00.000Z",
      updatedAt: "2026-03-07T10:00:00.000Z",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          await wait(30);
          return {
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    isCorrect: false,
                    score: 2,
                    feedbackSummary: "The wording is partly clear, but the spelling and phrasing still need work.",
                    correctedAnswer: "תודה שארגנת שקתרין תבוא לשבת במשרד בבר-אילן",
                    semanticAccepted: true,
                    naturalnessAccepted: false,
                    targetedPatternHandled: false,
                    issues: [
                      {
                        code: "spelling_error",
                        message: "The place name is misspelled.",
                        expectedFragment: "בר-אילן",
                        actualFragment: "ברא-אילן",
                      },
                      {
                        code: "structure_error",
                        message: "Use the more natural office context phrasing here.",
                        expectedFragment: "לשבת במשרד",
                        actualFragment: "חשוב במשרד",
                      },
                    ],
                  }),
                },
              },
            ],
          };
        },
      }),
    );

    const user = userEvent.setup();
    render(<PracticePage />);

    await user.type(await screen.findByLabelText(/type in hebrew/i), "תודה שארגנת שקתרין תבוא חשוב במשרד ברא-אילן");
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(await screen.findByText(/evaluating with llm/i)).toBeInTheDocument();
    expect(await screen.findByText(/almost there/i)).toBeInTheDocument();
  });

  test("renders issue explanations for highlighted feedback fragments", async () => {
    await mistakeRepository.upsert({
      id: "m1",
      englishPrompt: "Thanks for arranging for Catherine to come sit in the office at Bar-Ilan.",
      primaryTranslation: "תודה שארגנת שקתרין תבוא לשבת במשרד בבר-אילן",
      acceptableTranslations: ["תודה שארגנת שקתרין תבוא לשבת במשרד בבר-אילן"],
      practiceRoots: ["לשבת", "בר-אילן"],
      sourceText: "תודה שארגנת שקתרין תבוא להסתובב בבר-אילן",
      correctedText: "תודה שארגנת שקתרין תבוא לשבת במשרד בבר-אילן",
      wrongFragments: ["להסתובב", "ברא-אילן"],
      rightFragments: ["לשבת במשרד", "בר-אילן"],
      tags: ["context_word_choice"],
      contexts: ["office"],
      register: "casual",
      focusTokens: ["לשבת", "בר-אילן"],
      adjacentTokens: ["לשבת במשרד", "בר-אילן"],
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
        recentFocuses: ["לשבת"],
      },
    });
    await settingsRepository.save({
      id: "app_settings",
      llm: {
        mode: "enhanced",
        apiKey: "secret",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-5-mini",
      },
      typography: {
        practiceFontPreset: "assistant",
        customPracticeFont: "",
      },
      gradingMode: "balanced",
      gradingStrategy: "llm_led",
      defaultSessionLength: 5,
      createdAt: "2026-03-07T10:00:00.000Z",
      updatedAt: "2026-03-07T10:00:00.000Z",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          await wait(20);
          return {
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    isCorrect: false,
                    score: 0.48,
                    feedbackSummary: "You fixed the intent partly, but two targeted issues remain.",
                    correctedAnswer: "תודה שארגנת שקתרין תבוא לשבת במשרד בבר-אילן",
                    semanticAccepted: true,
                    naturalnessAccepted: false,
                    targetedPatternHandled: false,
                    issues: [
                      {
                        code: "spelling_error",
                        message: "The place name should include the hyphen.",
                        expectedFragment: "בר-אילן",
                        actualFragment: "ברא-אילן",
                      },
                      {
                        code: "structure_error",
                        message: "This needs the office-sitting phrasing instead.",
                        expectedFragment: "לשבת במשרד",
                        actualFragment: "חשוב במשרד",
                      },
                    ],
                  }),
                },
              },
            ],
          };
        },
      }),
    );

    const user = userEvent.setup();
    render(<PracticePage />);

    await user.type(await screen.findByLabelText(/type in hebrew/i), "תודה שארגנת שקתרין תבוא חשוב במשרד ברא-אילן");
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(await screen.findByText(/the place name should include the hyphen/i)).toBeInTheDocument();
    expect(await screen.findByText(/this needs the office-sitting phrasing instead/i)).toBeInTheDocument();
  });

  test("shows teaching details inline after submission", async () => {
    await mistakeRepository.upsert({
      id: "m1",
      englishPrompt: "I think he already left.",
      primaryTranslation: "אני חושב שהוא כבר יצא",
      acceptableTranslations: ["אני חושב שהוא כבר יצא"],
      practiceRoots: ["שהוא"],
      sourceText: "אני חושב הוא כבר יצא",
      correctedText: "אני חושב שהוא כבר יצא",
      wrongFragments: ["הוא"],
      rightFragments: ["שהוא"],
      tags: ["connector_omission"],
      contexts: ["casual_text"],
      register: "casual",
      focusTokens: ["שהוא"],
      adjacentTokens: ["אני חושב שהוא", "היא אמרה שהוא"],
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
        recentFocuses: ["שהוא"],
      },
    });

    const user = userEvent.setup();
    render(<PracticePage />);

    await user.type(await screen.findByLabelText(/type in hebrew/i), "אני חושב הוא כבר יצא");
    await user.click(screen.getByRole("button", { name: /check answer/i }));
    expect((await screen.findAllByText(/better phrasing/i)).length).toBeGreaterThan(0);
    expect(await screen.findByText(/why hebrew prefers it/i)).toBeInTheDocument();
    expect(await screen.findByText(/another example/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /show why/i })).not.toBeInTheDocument();
  });

  test("highlights the wrong fragment in what you wrote", async () => {
    await mistakeRepository.upsert({
      id: "m1",
      englishPrompt: "I think he already left.",
      primaryTranslation: "אני חושב שהוא כבר יצא",
      acceptableTranslations: ["אני חושב שהוא כבר יצא"],
      practiceRoots: ["שהוא"],
      sourceText: "אני חושב הוא כבר יצא",
      correctedText: "אני חושב שהוא כבר יצא",
      wrongFragments: ["הוא"],
      rightFragments: ["שהוא"],
      tags: ["connector_omission"],
      contexts: ["casual_text"],
      register: "casual",
      focusTokens: ["שהוא"],
      adjacentTokens: ["אני חושב שהוא", "היא אמרה שהוא"],
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
        recentFocuses: ["שהוא"],
      },
    });

    const user = userEvent.setup();
    render(<PracticePage />);

    await user.type(await screen.findByLabelText(/type in hebrew/i), "אני חושב הוא כבר יצא");
    await user.click(screen.getByRole("button", { name: /check answer/i }));
    const highlightedFragment = await screen.findByText("הוא");
    expect(highlightedFragment.className).toContain("teaching-highlight");
    expect(highlightedFragment.className).toContain("teaching-highlight--spelling");
  });

  test("stacks multiple issue highlights and combines their tooltip", async () => {
    await mistakeRepository.upsert({
      id: "m1",
      englishPrompt: "Drop it off at your place after work.",
      primaryTranslation: "אני יכול להוריד את זה אחרי העבודה אצלך.",
      acceptableTranslations: ["אני יכול להוריד את זה אחרי העבודה אצלך."],
      practiceRoots: ["להוריד", "אצלך"],
      sourceText: "אני לא בטוח. תלוי אל איך היום יהיה",
      correctedText: "אני יכול להוריד את זה אחרי העבודה אצלך.",
      wrongFragments: ["אבודה"],
      rightFragments: ["העבודה"],
      tags: ["spelling_error", "context_word_choice"],
      contexts: ["social"],
      register: "casual",
      focusTokens: ["אצלך", "להוריד"],
      adjacentTokens: ["אחרי העבודה", "אצלך"],
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
        recentFocuses: ["אצלך"],
      },
    });
    await settingsRepository.save({
      id: "app_settings",
      llm: {
        mode: "enhanced",
        apiKey: "secret",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-5-mini",
      },
      typography: {
        practiceFontPreset: "assistant",
        customPracticeFont: "",
      },
      gradingMode: "balanced",
      gradingStrategy: "llm_led",
      defaultSessionLength: 5,
      createdAt: "2026-03-07T10:00:00.000Z",
      updatedAt: "2026-03-07T10:00:00.000Z",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  isCorrect: false,
                  score: 0.42,
                  feedbackSummary: "The idea is partly clear, but one word is both misspelled and unnatural in context.",
                  correctedAnswer: "אני יכול להוריד את זה אחרי העבודה אצלך.",
                  teaching: {
                    yourAnswer: "אני יכול להוריד את זה אחרי אבודה אצלך.",
                    betterAnswer: "אני יכול להוריד את זה אחרי העבודה אצלך.",
                    whatChanged: "Changed אבודה to העבודה.",
                    whyPreferred: "העבודה is the correct spelling and the natural context phrase.",
                    why: "Use the standard spelling in this phrase.",
                    anotherExample: "אני אעבור אצלך אחרי העבודה.",
                  },
                  semanticAccepted: true,
                  naturalnessAccepted: false,
                  targetedPatternHandled: false,
                  issues: [
                    {
                      code: "spelling_error",
                      message: "העבודה is spelled with ה at the start.",
                      expectedFragment: "העבודה",
                      actualFragment: "אבודה",
                    },
                    {
                      code: "structure_error",
                      message: "In this context, אחרי העבודה is the natural phrase.",
                      expectedFragment: "העבודה",
                      actualFragment: "אבודה",
                    },
                  ],
                }),
              },
            },
          ],
        }),
      }),
    );

    const user = userEvent.setup();
    render(<PracticePage />);

    await user.type(await screen.findByLabelText(/type in hebrew/i), "אני יכול להוריד את זה אחרי אבודה אצלך.");
    await user.click(screen.getByRole("button", { name: /check answer/i }));
    const highlightedFragment = await screen.findByText("אבודה");
    expect(highlightedFragment.className).toContain("teaching-highlight--spelling");
    expect(highlightedFragment.className).toContain("teaching-highlight--grammar");
    expect(highlightedFragment).toHaveAttribute(
      "title",
      expect.stringContaining("העבודה is spelled with ה at the start."),
    );
    expect(highlightedFragment).toHaveAttribute(
      "title",
      expect.stringContaining("אחרי העבודה is the natural phrase."),
    );
  });

  test("falls back to diff-based highlighting when the llm returns no actual fragment", async () => {
    await mistakeRepository.upsert({
      id: "m1",
      englishPrompt: "I am not sure, it depends how the day goes.",
      primaryTranslation: "אני עוד לא בטוח/ה, זה תלוי איך היום ילך.",
      acceptableTranslations: ["אני עוד לא בטוח/ה, זה תלוי איך היום ילך."],
      practiceRoots: ["תלוי", "ילך"],
      sourceText: "אני לא בטוח. תלוי אל איך היום יהיה",
      correctedText: "אני עוד לא בטוח/ה, זה תלוי איך היום ילך.",
      wrongFragments: ["אל"],
      rightFragments: ["איך"],
      tags: ["context_word_choice"],
      contexts: ["casual_text"],
      register: "casual",
      focusTokens: ["תלוי", "ילך"],
      adjacentTokens: ["זה תלוי", "איך היום ילך"],
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
        recentFocuses: ["תלוי"],
      },
    });
    await settingsRepository.save({
      id: "app_settings",
      llm: {
        mode: "enhanced",
        apiKey: "secret",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-5-mini",
      },
      typography: {
        practiceFontPreset: "assistant",
        customPracticeFont: "",
      },
      gradingMode: "balanced",
      gradingStrategy: "llm_led",
      defaultSessionLength: 5,
      createdAt: "2026-03-07T10:00:00.000Z",
      updatedAt: "2026-03-07T10:00:00.000Z",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  isCorrect: false,
                  score: 0.4,
                  feedbackSummary: "The meaning is close, but the Hebrew phrasing needs revision.",
                  correctedAnswer: "אני עוד לא בטוח/ה, זה תלוי איך היום ילך.",
                  teaching: {
                    yourAnswer: "אני לא בטוח. תלוי אל איך היום יהיה",
                    betterAnswer: "אני עוד לא בטוח/ה, זה תלוי איך היום ילך.",
                    whatChanged: "Adjusted the structure and verb choice.",
                    whyPreferred: "Hebrew prefers זה תלוי איך היום ילך here.",
                    why: "This version sounds more natural.",
                    anotherExample: "אני לא יודע, זה תלוי איך הערב יתפתח.",
                  },
                  semanticAccepted: true,
                  naturalnessAccepted: false,
                  targetedPatternHandled: false,
                  issues: [
                    {
                      code: "structure_error",
                      message: "Use the more natural structure here.",
                      expectedFragment: "זה תלוי איך היום ילך",
                    },
                  ],
                }),
              },
            },
          ],
        }),
      }),
    );

    const user = userEvent.setup();
    render(<PracticePage />);

    await user.type(await screen.findByLabelText(/type in hebrew/i), "אני לא בטוח. תלוי אל איך היום יהיה");
    await user.click(screen.getByRole("button", { name: /check answer/i }));
    const highlightedFragment = await screen.findByText("אל");
    expect(highlightedFragment.className).toContain("teaching-highlight");
  });

  test("hides the teaching disclosure when an accepted answer is already correct as written", async () => {
    await mistakeRepository.upsert({
      id: "m1",
      englishPrompt: "I think he already left.",
      primaryTranslation: "אני חושב שהוא כבר יצא",
      acceptableTranslations: ["אני חושב שהוא כבר יצא"],
      practiceRoots: ["שהוא"],
      sourceText: "אני חושב הוא כבר יצא",
      correctedText: "אני חושב שהוא כבר יצא",
      wrongFragments: ["הוא"],
      rightFragments: ["שהוא"],
      tags: ["connector_omission"],
      contexts: ["casual_text"],
      register: "casual",
      focusTokens: ["שהוא"],
      adjacentTokens: ["אני חושב שהוא", "הוא אמר שהוא"],
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
        recentFocuses: ["שהוא"],
      },
    });

    const user = userEvent.setup();
    render(<PracticePage />);

    await user.type(await screen.findByLabelText(/type in hebrew/i), "אני חושב שהוא כבר יצא");
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(await screen.findByText(/strong/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /show why/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/better phrasing/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/you wrote/i)).not.toBeInTheDocument();
  });

  test("auto-saves generated future practice items for each detected mistake", async () => {
    await mistakeRepository.upsert({
      id: "m1",
      englishPrompt: "I’m a bit tired today, not going to lie.",
      primaryTranslation: "אני קצת עייף היום, לא אשקר.",
      acceptableTranslations: ["אני קצת עייף היום, לא אשקר."],
      practiceRoots: ["קצת", "עייף"],
      sourceText: "אני לא אשקר, אני היף היום",
      correctedText: "אני קצת עייף היום, לא אשקר.",
      wrongFragments: ["היף", "אני לא אשקר, אני"],
      rightFragments: ["עייף", "אני קצת עייף היום, לא אשקר"],
      tags: ["structure_error"],
      contexts: ["casual_text"],
      register: "casual",
      focusTokens: ["קצת", "עייף"],
      adjacentTokens: ["לא אשקר", "קצת עייף"],
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
        recentFocuses: ["קצת"],
      },
    });
    await settingsRepository.save({
      id: "app_settings",
      llm: {
        mode: "enhanced",
        apiKey: "secret",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-5-mini",
      },
      typography: {
        practiceFontPreset: "assistant",
        customPracticeFont: "",
      },
      gradingMode: "balanced",
      gradingStrategy: "llm_led",
      defaultSessionLength: 5,
      createdAt: "2026-03-07T10:00:00.000Z",
      updatedAt: "2026-03-07T10:00:00.000Z",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
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
                  teaching: {
                    yourAnswer: "אני לא אשקר, אני היף היום",
                    betterAnswer: "אני קצת עייף היום, לא אשקר.",
                    whatChanged: "The sentence was adjusted around the spelling and word order.",
                    whyPreferred: "Hebrew prefers the softer construction and correct spelling.",
                    why: "The meaning was clear, but two targeted issues remain.",
                    anotherExample: "אני קצת לחוץ היום, לא אשקר.",
                  },
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
              },
            },
          ],
        }),
      }),
    );

    const user = userEvent.setup();
    render(<PracticePage />);

    await user.type(await screen.findByLabelText(/type in hebrew/i), "אני לא אשקר, אני היף היום");
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    const mistakes = await mistakeRepository.list();

    expect(mistakes).toHaveLength(3);
    expect(mistakes.some((entry) => entry.englishPrompt === "I am tired today.")).toBe(true);
    expect(
      mistakes.some(
        (entry) =>
          entry.englishPrompt === "I am a bit nervous today, not going to lie.",
      ),
    ).toBe(true);
  });

  test("skips malformed generated practice items instead of crashing", async () => {
    await mistakeRepository.upsert({
      id: "m1",
      englishPrompt: "I’m a bit tired today, not going to lie.",
      primaryTranslation: "אני קצת עייף היום, לא אשקר.",
      acceptableTranslations: ["אני קצת עייף היום, לא אשקר."],
      practiceRoots: ["קצת", "עייף"],
      sourceText: "אני לא אשקר, אני היף היום",
      correctedText: "אני קצת עייף היום, לא אשקר.",
      wrongFragments: ["היף"],
      rightFragments: ["עייף"],
      tags: ["spelling_error"],
      contexts: ["casual_text"],
      register: "casual",
      focusTokens: ["קצת", "עייף"],
      adjacentTokens: ["לא אשקר", "קצת עייף"],
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
        recentFocuses: ["קצת"],
      },
    });
    await settingsRepository.save({
      id: "app_settings",
      llm: {
        mode: "enhanced",
        apiKey: "secret",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-5-mini",
      },
      typography: {
        practiceFontPreset: "assistant",
        customPracticeFont: "",
      },
      gradingMode: "balanced",
      gradingStrategy: "llm_led",
      defaultSessionLength: 5,
      createdAt: "2026-03-07T10:00:00.000Z",
      updatedAt: "2026-03-07T10:00:00.000Z",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  isCorrect: false,
                  score: 0.44,
                  feedbackSummary: "One targeted mistake remains.",
                  correctedAnswer: "אני קצת עייף היום, לא אשקר.",
                  semanticAccepted: true,
                  naturalnessAccepted: false,
                  targetedPatternHandled: false,
                  issues: [],
                  teaching: {
                    yourAnswer: "אני לא אשקר, אני היף היום",
                    betterAnswer: "אני קצת עייף היום, לא אשקר.",
                    whatChanged: "The sentence was adjusted for natural word order.",
                    whyPreferred: "The revised version matches natural Hebrew better.",
                    why: "The meaning is clear, but the phrasing needs a more natural construction.",
                    anotherExample: "אני קצת לחוץ היום, לא אשקר.",
                  },
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
                          acceptableTranslations: ["אני עייף היום."],
                          focusTokens: ["עייף"],
                          practiceRoots: ["עייף"],
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
      }),
    );

    const user = userEvent.setup();
    render(<PracticePage />);

    await user.type(await screen.findByLabelText(/type in hebrew/i), "אני לא אשקר, אני היף היום");
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(await screen.findByText(/needs another pass|almost there/i)).toBeInTheDocument();
    const mistakes = await mistakeRepository.list();
    expect(mistakes).toHaveLength(1);
  });
});
