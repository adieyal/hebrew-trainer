export { createDefaultSettings } from "../../domain/services/settings-service";
import type { PracticeFontPreset } from "../../domain/models/settings";

export const OPENAI_BASE_URL_OPTIONS = ["https://api.openai.com/v1"] as const;

export const OPENAI_MODEL_OPTIONS = [
  "gpt-5.4",
  "gpt-5-mini",
  "gpt-5-nano",
  "gpt-5",
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "o3",
  "o4-mini",
  "gpt-4o",
  "gpt-4o-mini",
] as const;

export const PRACTICE_FONT_OPTIONS: Array<{
  value: PracticeFontPreset;
  label: string;
  stack: string;
}> = [
  {
    value: "assistant",
    label: "Assistant",
    stack: '"Assistant", "Rubik", "Heebo", sans-serif',
  },
  {
    value: "adelle_sans",
    label: "Adelle Sans",
    stack: '"Adelle Sans", "AdelleSans", "Assistant", "Rubik", sans-serif',
  },
  {
    value: "rubik",
    label: "Rubik",
    stack: '"Rubik", "Assistant", "Heebo", sans-serif',
  },
  {
    value: "heebo",
    label: "Heebo",
    stack: '"Heebo", "Assistant", "Rubik", sans-serif',
  },
  {
    value: "system",
    label: "System Sans",
    stack: '"Segoe UI", "Arial", sans-serif',
  },
  {
    value: "custom",
    label: "Custom",
    stack: "",
  },
] as const;

export function resolvePracticeFontStack(
  preset: PracticeFontPreset,
  customFont?: string,
): string {
  if (preset === "custom") {
    return customFont?.trim()
      ? `${customFont.trim()}, "Assistant", "Rubik", "Heebo", sans-serif`
      : '"Assistant", "Rubik", "Heebo", sans-serif';
  }

  return (
    PRACTICE_FONT_OPTIONS.find((option) => option.value === preset)?.stack ??
    '"Assistant", "Rubik", "Heebo", sans-serif'
  );
}
