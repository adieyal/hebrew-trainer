import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { createDefaultSettings } from "../domain/services/settings-service";
import { resetTrainerDb } from "../storage/db";
import { settingsRepository } from "../storage/repositories/settings-repository";
import { AppProviders } from "./providers";

afterEach(async () => {
  document.documentElement.style.removeProperty("--font-hebrew-training");
  await resetTrainerDb();
});

describe("AppProviders", () => {
  test("applies the saved practice font on mount", async () => {
    const settings = createDefaultSettings("2026-03-07T10:00:00.000Z");
    settings.typography.practiceFontPreset = "adelle_sans";
    await settingsRepository.save(settings);

    render(
      <AppProviders>
        <div>Child</div>
      </AppProviders>,
    );

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue("--font-hebrew-training")).toContain(
        '"Adelle Sans"',
      );
    });
  });
});
