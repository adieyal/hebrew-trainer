import { createId } from "../utils/ids";
import type { ContextTag, ImportCandidate, MistakeTag, Register } from "../models/mistake";

function inferTag(sourceText: string | undefined, correctedText: string): MistakeTag[] {
  const combined = `${sourceText ?? ""} ${correctedText}`;
  if (combined.includes("אחד") || combined.includes("אחת")) {
    return ["time_expression", "gender_number"];
  }

  if (combined.includes("שהוא") || combined.includes("של")) {
    return ["connector_omission"];
  }

  return ["spelling_error"];
}

function inferRegister(text: string): Register {
  return text.includes("בהתאם לכך") ? "formal" : "casual";
}

function inferFocusTokens(sourceText: string | undefined, correctedText: string): string[] {
  const sourceTokens = new Set((sourceText ?? "").split(/\s+/).filter(Boolean));
  return correctedText
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !sourceTokens.has(token))
    .slice(0, 3);
}

function inferEnglishContext(text: string): ContextTag[] {
  const lower = text.toLowerCase();
  if (lower.includes("before") || lower.includes("tomorrow") || lower.includes("today")) {
    return ["scheduling"];
  }

  if (lower.includes("office") || lower.includes("meeting")) {
    return ["office"];
  }

  return ["casual_text"];
}

function buildCandidate(
  sourceText: string | undefined,
  correctedText: string,
  confidence: number,
  englishPrompt?: string,
): ImportCandidate {
  const isEnglishPromptOnly = Boolean(englishPrompt && !sourceText && !correctedText);

  return {
    id: createId("candidate"),
    englishPrompt,
    primaryTranslation: correctedText || undefined,
    acceptableTranslations: correctedText ? [correctedText] : [],
    practiceRoots: isEnglishPromptOnly ? [] : inferFocusTokens(sourceText, correctedText),
    sourceText,
    correctedText,
    wrongFragments: sourceText ? [sourceText] : [],
    rightFragments: correctedText ? [correctedText] : [],
    tags: isEnglishPromptOnly ? [] : inferTag(sourceText, correctedText),
    contexts: englishPrompt ? inferEnglishContext(englishPrompt) : ["casual_text"],
    register: correctedText ? inferRegister(correctedText) : "neutral",
    ruleNote:
      englishPrompt
        ? "Translate the English meaning into natural Hebrew."
        : sourceText
          ? "Practice the corrected form exactly as written."
          : undefined,
    focusTokens: isEnglishPromptOnly ? [] : inferFocusTokens(sourceText, correctedText),
    adjacentTokens: correctedText.split(/\s+/).filter(Boolean).slice(0, 4),
    confidence,
  };
}

export function parseCorrections(rawText: string): ImportCandidate[] {
  const candidates: ImportCandidate[] = [];
  const blockRegex =
    /Original:\s*(.+?)\s*Corrected:\s*(.+?)(?=(?:\n\s*\n)|(?:\nOriginal:)|$)/gms;

  for (const match of rawText.matchAll(blockRegex)) {
    candidates.push(buildCandidate(match[1].trim(), match[2].trim(), 0.96));
  }

  if (candidates.length > 0) {
    return candidates;
  }

  const arrowLines = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of arrowLines) {
    const parts = line.split("->");
    if (parts.length === 2) {
      candidates.push(buildCandidate(parts[0].trim(), parts[1].trim(), 0.92));
    }
  }

  if (candidates.length > 0) {
    return candidates;
  }

  const transcriptMatch = rawText.match(
    /correct my hebrew:\s*(.+?)\s+(?:הנה גרסה מתוקנת:|corrected:)\s*(.+)/is,
  );

  if (transcriptMatch) {
    candidates.push(
      buildCandidate(transcriptMatch[1].trim(), transcriptMatch[2].trim(), 0.66),
    );
  }

  if (candidates.length > 0) {
    return candidates;
  }

  const englishLines = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => /[A-Za-z]/.test(line));

  for (const line of englishLines) {
    candidates.push(buildCandidate(undefined, "", 0.9, line));
  }

  return candidates;
}
