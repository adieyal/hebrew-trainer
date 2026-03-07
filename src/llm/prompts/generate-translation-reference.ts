import type { ContextTag, Register } from "../../domain/models/mistake";

export interface TranslationReferencePromptInput {
  englishPrompt: string;
  register?: Register;
  contexts?: ContextTag[];
}

export function buildGenerateTranslationReferencePrompt(
  input: TranslationReferencePromptInput,
): string {
  return [
    "Generate Hebrew translation references as JSON only.",
    `English prompt: ${input.englishPrompt}`,
    `Preferred register: ${input.register ?? "casual"}`,
    `Contexts: ${JSON.stringify(input.contexts ?? ["casual_text"])}`,
    "Return JSON keys: primaryTranslation, acceptableTranslations, focusTokens, practiceRoots, register, contexts, ruleNote",
    "acceptableTranslations should include 2 to 4 natural Hebrew variants when possible.",
    "focusTokens and practiceRoots should highlight the key Hebrew forms worth practicing.",
  ].join("\n");
}
