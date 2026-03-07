import type {
  AppSettings,
  GradingStrategy,
  LlmSettings,
} from "../models/settings";

export function resolveDefaultGradingStrategy(llm: Pick<LlmSettings, "apiKey">): GradingStrategy {
  return llm.apiKey ? "llm_led" : "rule_based_only";
}

export function createDefaultSettings(
  nowIso: string,
  llmOverrides: Partial<LlmSettings> = {},
): AppSettings {
  const llm: LlmSettings = {
    mode: "disabled",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-5-mini",
    ...llmOverrides,
  };

  return {
    id: "app_settings",
    llm,
    typography: {
      practiceFontPreset: "assistant",
      customPracticeFont: "",
    },
    gradingMode: "balanced",
    gradingStrategy: resolveDefaultGradingStrategy(llm),
    defaultSessionLength: 5,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export function normalizeAppSettings(settings: AppSettings): AppSettings {
  return {
    ...settings,
    typography: {
      practiceFontPreset: settings.typography?.practiceFontPreset ?? "assistant",
      customPracticeFont: settings.typography?.customPracticeFont ?? "",
    },
  };
}
