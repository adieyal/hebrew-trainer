export type LlmMode = "disabled" | "assistive" | "enhanced";
export type GradingMode = "strict" | "balanced";
export type GradingStrategy = "rule_based_only" | "hybrid_fallback" | "llm_led";
export type PracticeFontPreset =
  | "assistant"
  | "adelle_sans"
  | "rubik"
  | "heebo"
  | "system"
  | "custom";

export interface LlmSettings {
  mode: LlmMode;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface TypographySettings {
  practiceFontPreset: PracticeFontPreset;
  customPracticeFont?: string;
}

export interface AppSettings {
  id: "app_settings";
  llm: LlmSettings;
  typography: TypographySettings;
  gradingMode: GradingMode;
  gradingStrategy: GradingStrategy;
  defaultSessionLength: 5 | 10 | 15;
  createdAt: string;
  updatedAt: string;
}
