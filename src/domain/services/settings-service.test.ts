import { describe, expect, test } from "vitest";
import {
  createDefaultSettings,
  normalizeAppSettings,
  resolveDefaultGradingStrategy,
} from "./settings-service";

describe("settings-service", () => {
  test("defaults to rule-based grading when no api key exists", () => {
    const settings = createDefaultSettings("2026-03-07T10:00:00.000Z");

    expect(settings.gradingStrategy).toBe("rule_based_only");
    expect(settings.llm.baseUrl).toBe("https://api.openai.com/v1");
    expect(settings.llm.model).toBe("gpt-5-mini");
    expect(settings.typography.practiceFontPreset).toBe("assistant");
  });

  test("defaults to llm-led grading when an api key exists", () => {
    expect(resolveDefaultGradingStrategy({ apiKey: "test-key" })).toBe("llm_led");
  });

  test("normalizes legacy settings without typography", () => {
    const normalized = normalizeAppSettings({
      id: "app_settings",
      llm: { mode: "disabled" },
      gradingMode: "balanced",
      gradingStrategy: "rule_based_only",
      defaultSessionLength: 5,
      createdAt: "2026-03-07T10:00:00.000Z",
      updatedAt: "2026-03-07T10:00:00.000Z",
    } as never);

    expect(normalized.typography.practiceFontPreset).toBe("assistant");
    expect(normalized.typography.customPracticeFont).toBe("");
  });
});
