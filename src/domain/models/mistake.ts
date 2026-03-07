export type MistakeTag =
  | "common_word_spelling"
  | "connector_omission"
  | "time_expression"
  | "gender_number"
  | "direct_translation"
  | "context_word_choice"
  | "register_mismatch"
  | "structure_error"
  | "spelling_error"
  | "non_native_collocation";

export type ContextTag =
  | "casual_text"
  | "formal_note"
  | "office"
  | "scheduling"
  | "social";

export type Register = "casual" | "neutral" | "formal";

export type MasteryBand = "new" | "fragile" | "building" | "solid";

export interface MistakeStats {
  attempts: number;
  correctCount: number;
  streak: number;
  relapseCount: number;
  mastery: number;
  masteryBand: MasteryBand;
  weaknessScore: number;
  exposureCount: number;
  recentFocuses: string[];
  lastAttemptAt?: string;
  nextReviewAt?: string;
}

export interface MistakeEntry {
  englishPrompt?: string;
  primaryTranslation?: string;
  acceptableTranslations?: string[];
  practiceRoots?: string[];
  id: string;
  sourceText?: string;
  correctedText: string;
  wrongFragments: string[];
  rightFragments: string[];
  tags: MistakeTag[];
  contexts: ContextTag[];
  register: Register;
  ruleNote?: string;
  focusTokens: string[];
  adjacentTokens: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  derivedFrom?: {
    source: "llm_remediation";
    attemptId: string;
    exerciseId: string;
    actualFragment: string;
    expectedFragment: string;
  };
  stats: MistakeStats;
}

export interface ImportCandidate {
  englishPrompt?: string;
  primaryTranslation?: string;
  acceptableTranslations?: string[];
  practiceRoots?: string[];
  id: string;
  sourceText?: string;
  correctedText: string;
  wrongFragments: string[];
  rightFragments: string[];
  tags: MistakeTag[];
  contexts: ContextTag[];
  register: Register;
  ruleNote?: string;
  focusTokens: string[];
  adjacentTokens: string[];
  confidence: number;
}
