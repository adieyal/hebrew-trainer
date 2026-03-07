import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "vitest";
import { resetTrainerDb } from "../../../storage/db";
import { mistakeRepository } from "../../../storage/repositories/mistake-repository";
import { settingsRepository } from "../../../storage/repositories/settings-repository";
import { SettingsPage } from "./SettingsPage";

afterEach(async () => {
  document.documentElement.style.removeProperty("--font-hebrew-training");
  await resetTrainerDb();
});

describe("SettingsPage", () => {
  test("creates and saves default settings", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.selectOptions(
      await screen.findByLabelText(/default session length/i),
      "10",
    );
    await user.click(screen.getByRole("button", { name: /save settings/i }));

    const settings = await settingsRepository.get();
    expect(settings?.defaultSessionLength).toBe(10);
  });

  test("auto-switches grading strategy when an api key is entered", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.type(await screen.findByLabelText(/api key/i), "secret");
    await user.click(screen.getByRole("button", { name: /save settings/i }));

    const settings = await settingsRepository.get();
    expect(settings?.gradingStrategy).toBe("llm_led");
  });

  test("saves the selected practice font preset", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.selectOptions(await screen.findByLabelText(/practice font/i), "adelle_sans");
    await user.click(screen.getByRole("button", { name: /save settings/i }));

    const settings = await settingsRepository.get();
    expect(settings?.typography.practiceFontPreset).toBe("adelle_sans");
  });

  test("updates the practice font preview variable", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.selectOptions(await screen.findByLabelText(/practice font/i), "adelle_sans");

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue("--font-hebrew-training")).toContain(
        '"Adelle Sans"',
      );
    });
  });

  test("resets progress without deleting stored entries", async () => {
    await mistakeRepository.upsert({
      id: "m1",
      englishPrompt: "How are you?",
      primaryTranslation: "מה איתך?",
      acceptableTranslations: ["מה איתך?"],
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

    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(await screen.findByRole("button", { name: /reset progress/i }));
    await screen.findByText(/reset practice progress\. your sentence bank was preserved\./i);

    const settings = await settingsRepository.get();
    const mistakes = await mistakeRepository.list();
    expect(settings).toBeTruthy();
    expect(mistakes).toHaveLength(1);
    expect(mistakes[0]?.stats.attempts).toBe(0);
    expect(mistakes[0]?.stats.masteryBand).toBe("new");
  });

  test("loads legacy settings without typography and repairs them", async () => {
    await settingsRepository.save({
      id: "app_settings",
      llm: { mode: "disabled" },
      gradingMode: "balanced",
      gradingStrategy: "rule_based_only",
      defaultSessionLength: 5,
      createdAt: "2026-03-07T10:00:00.000Z",
      updatedAt: "2026-03-07T10:00:00.000Z",
    } as never);

    render(<SettingsPage />);

    expect(await screen.findByLabelText(/practice font/i)).toHaveValue("assistant");

    const settings = await settingsRepository.get();
    expect(settings?.typography.practiceFontPreset).toBe("assistant");
  });
});
