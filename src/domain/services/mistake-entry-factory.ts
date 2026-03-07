import type { AttemptMistakeAnalysis } from "../models/attempt";
import type { ImportCandidate, MistakeEntry, MistakeTag } from "../models/mistake";
import { createId } from "../utils/ids";

export function createMistakeEntryFromCandidate(
  candidate: ImportCandidate,
  nowIso: string,
): MistakeEntry {
  return {
    id: createId("mistake"),
    englishPrompt: candidate.englishPrompt,
    primaryTranslation: candidate.primaryTranslation ?? candidate.correctedText,
    acceptableTranslations:
      candidate.acceptableTranslations ??
      (candidate.correctedText ? [candidate.correctedText] : []),
    practiceRoots: candidate.practiceRoots ?? candidate.focusTokens,
    sourceText: candidate.sourceText,
    correctedText: candidate.correctedText,
    wrongFragments: candidate.wrongFragments,
    rightFragments: candidate.rightFragments,
    tags: candidate.tags,
    contexts: candidate.contexts,
    register: candidate.register,
    ruleNote: candidate.ruleNote,
    focusTokens: candidate.focusTokens,
    adjacentTokens: candidate.adjacentTokens,
    createdAt: nowIso,
    updatedAt: nowIso,
    stats: {
      attempts: 0,
      correctCount: 0,
      streak: 0,
      relapseCount: 0,
      mastery: 0,
      masteryBand: "new",
      weaknessScore: 1,
      exposureCount: 0,
      recentFocuses: candidate.focusTokens.slice(0, 3),
    },
  };
}

function toMistakeTag(code: AttemptMistakeAnalysis["issueCode"]): MistakeTag {
  switch (code) {
    case "spelling_error":
      return "spelling_error";
    case "register_mismatch":
      return "register_mismatch";
    case "structure_error":
      return "structure_error";
    case "wrong_fragment":
    case "missing_fragment":
    case "near_miss":
      return "direct_translation";
    default:
      return "structure_error";
  }
}

export function createMistakeEntryFromGeneratedPracticeItem(
  analysis: AttemptMistakeAnalysis,
  practiceItem: AttemptMistakeAnalysis["practiceItems"][number],
  nowIso: string,
  source: {
    attemptId: string;
    exerciseId: string;
  },
): MistakeEntry {
  return {
    id: createId("mistake"),
    englishPrompt: practiceItem.englishPrompt,
    primaryTranslation: practiceItem.primaryTranslation,
    acceptableTranslations: practiceItem.acceptableTranslations,
    practiceRoots: practiceItem.practiceRoots,
    sourceText: analysis.actualFragment,
    correctedText: practiceItem.primaryTranslation,
    wrongFragments: [analysis.actualFragment],
    rightFragments: [analysis.expectedFragment],
    tags: [toMistakeTag(analysis.issueCode)],
    contexts: practiceItem.contexts ?? ["casual_text"],
    register: practiceItem.register ?? "neutral",
    ruleNote: analysis.whyPreferred,
    focusTokens: practiceItem.focusTokens,
    adjacentTokens: practiceItem.acceptableTranslations.slice(0, 4),
    createdAt: nowIso,
    updatedAt: nowIso,
    derivedFrom: {
      source: "llm_remediation",
      attemptId: source.attemptId,
      exerciseId: source.exerciseId,
      actualFragment: analysis.actualFragment,
      expectedFragment: analysis.expectedFragment,
    },
    stats: {
      attempts: 0,
      correctCount: 0,
      streak: 0,
      relapseCount: 0,
      mastery: 0,
      masteryBand: "new",
      weaknessScore: 1,
      exposureCount: 0,
      recentFocuses: practiceItem.focusTokens.slice(0, 3),
    },
  };
}
