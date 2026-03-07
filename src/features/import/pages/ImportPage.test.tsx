import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { resetTrainerDb } from "../../../storage/db";
import { mistakeRepository } from "../../../storage/repositories/mistake-repository";
import { settingsRepository } from "../../../storage/repositories/settings-repository";
import { ImportPage } from "./ImportPage";

afterEach(async () => {
  await resetTrainerDb();
});

describe("ImportPage", () => {
  test("shows english-only prompts as waiting for Hebrew generation", async () => {
    const user = userEvent.setup();
    render(<ImportPage />);

    const input = await screen.findByLabelText(/english prompts/i);
    await user.clear(input);
    await user.type(input, "I'm running a bit late, be there soon.");

    await user.click(screen.getByRole("button", { name: /parse prompts/i }));

    expect(await screen.findByText(/review prompts before saving/i)).toBeInTheDocument();
    expect(screen.getByText(/hebrew will be generated on save/i)).toBeInTheDocument();
    expect(
      screen.getByText(/a hebrew reference answer will be generated automatically when you save this prompt\./i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/spelling_error/i)).not.toBeInTheDocument();
  });

  test("parses english prompts and saves generated translation references", async () => {
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
                  primaryTranslation: "אתה יכול להגיע לפני אחת?",
                  acceptableTranslations: [
                    "אתה יכול להגיע לפני אחת?",
                    "אפשר להגיע לפני אחת?",
                  ],
                  focusTokens: ["להגיע", "אחת"],
                  practiceRoots: ["להגיע", "אחת"],
                  register: "casual",
                  contexts: ["scheduling"],
                  ruleNote: "Use the feminine form for clock time.",
                }),
              },
            },
          ],
        }),
      }),
    );

    const user = userEvent.setup();
    render(<ImportPage />);

    const input = await screen.findByLabelText(/english prompts/i);
    await user.clear(input);
    await user.type(input, "Can you get here before one?");

    await user.click(screen.getByRole("button", { name: /parse prompts/i }));
    expect(screen.getByText(/parsed 1 prompt candidate/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /generate hebrew and save/i }));
    await screen.findByText(/saved 1 translation prompts to your bank/i);

    const mistakes = await mistakeRepository.list();
    expect(mistakes).toHaveLength(1);
    expect(mistakes[0]?.englishPrompt).toBe("Can you get here before one?");
    expect(mistakes[0]?.primaryTranslation).toBe("אתה יכול להגיע לפני אחת?");
  });
});
