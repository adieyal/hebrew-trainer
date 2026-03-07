import type { LlmGenerateVariationInput } from "../llm-client";

export function buildGenerateVariationPrompt(
  input: LlmGenerateVariationInput,
): string {
  return [
    "Generate realistic Hebrew practice exercises as JSON only.",
    `Corrected text: ${input.mistake.correctedText}`,
    `Source text: ${input.mistake.sourceText ?? ""}`,
    `Focus tokens: ${JSON.stringify(input.mistake.focusTokens)}`,
    `Adjacent tokens: ${JSON.stringify(input.mistake.adjacentTokens)}`,
    `Practice roots: ${JSON.stringify(input.mistake.focusTokens)}`,
    `Preferred types: ${JSON.stringify(input.preferredTypes)}`,
    `Count: ${input.count}`,
    "Preserve the same learning target while varying the sentence context.",
  ].join("\n");
}
