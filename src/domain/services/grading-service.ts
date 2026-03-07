import type { AttemptIssue, AttemptResult } from "../models/attempt";
import type { Exercise } from "../models/exercise";
import type { GradingMode, GradingStrategy } from "../models/settings";
import type { LlmClient } from "../../llm/llm-client";
import { normalizeHebrewText, tokenizeHebrewText } from "../utils/hebrew-normalize";
import { diffTokens } from "../utils/token-diff";

export interface GradeExerciseOptions {
  gradingMode?: GradingMode;
  gradingStrategy?: GradingStrategy;
  llmClient?: LlmClient;
}

function toIssueMessage(issue: AttemptIssue): string {
  if (issue.expectedFragment && issue.actualFragment) {
    return `Expected "${issue.expectedFragment}" instead of "${issue.actualFragment}".`;
  }

  if (issue.expectedFragment) {
    return `Missing "${issue.expectedFragment}".`;
  }

  if (issue.actualFragment) {
    return `Unexpected "${issue.actualFragment}".`;
  }

  return issue.message;
}

function containsHebrewScript(value: string | undefined): boolean {
  return /[\u0590-\u05FF]/.test(value ?? "");
}

function pickEnglishExplanation(
  value: string | undefined,
  fallback: string,
): string {
  if (!value) {
    return fallback;
  }

  return containsHebrewScript(value) ? fallback : value;
}

function normalizeTeachingPayload(
  userAnswer: string,
  correctedAnswer: string,
  teaching:
    | {
        yourAnswer: string;
        betterAnswer: string;
        whatChanged?: string;
        whyPreferred?: string;
        why: string;
        anotherExample?: string | null;
      }
    | undefined,
): AttemptResult["teaching"] {
  if (!teaching) {
    return undefined;
  }

  const normalizedUser = normalizeHebrewText(userAnswer, {
    ignoreTerminalPeriod: true,
  });
  const normalizedBetter = normalizeHebrewText(teaching.betterAnswer, {
    ignoreTerminalPeriod: true,
  });

  if (normalizedUser === normalizedBetter) {
    return {
      yourAnswer: teaching.yourAnswer || userAnswer,
      betterAnswer: teaching.betterAnswer || correctedAnswer,
      whatChanged: "No wording change is needed.",
      whyPreferred: "This version is already natural and acceptable in Hebrew.",
      why: "Your answer is already acceptable as written.",
      anotherExample: teaching.anotherExample ?? undefined,
    };
  }

  const fallbackWhatChanged = `The sentence was adjusted from "${teaching.yourAnswer || userAnswer}" to "${teaching.betterAnswer || correctedAnswer}".`;
  const fallbackWhyPreferred =
    "The revised version matches the intended Hebrew pattern more naturally.";
  const fallbackWhy =
    "The meaning is clear, but the phrasing needs a more natural Hebrew construction.";

  return {
    ...teaching,
    whatChanged: pickEnglishExplanation(teaching.whatChanged, fallbackWhatChanged),
    whyPreferred: pickEnglishExplanation(
      teaching.whyPreferred ?? teaching.why,
      fallbackWhyPreferred,
    ),
    why: pickEnglishExplanation(teaching.why, fallbackWhy),
    anotherExample: teaching.anotherExample ?? undefined,
  };
}

function ruleBasedGradeExerciseAnswer(
  exercise: Exercise,
  userAnswer: string,
  gradingMode: GradingMode = "balanced",
): AttemptResult {
  const normalizedAnswer = normalizeHebrewText(userAnswer, {
    ignoreTerminalPeriod: gradingMode === "balanced",
  });
  const normalizedTarget = normalizeHebrewText(exercise.targetAnswer, {
    ignoreTerminalPeriod: gradingMode === "balanced",
  });

  if (normalizedAnswer === normalizedTarget) {
    return {
      isCorrect: true,
      score: 1,
      issues: [],
      feedbackSummary: "Correct. You used the target pattern accurately.",
      correctedAnswer: exercise.targetAnswer,
      shouldCreateDerivedMistake: false,
      teaching: {
        yourAnswer: userAnswer,
        betterAnswer: exercise.targetAnswer,
        whatChanged: "No wording change is needed.",
        whyPreferred: "This version already uses the target Hebrew pattern naturally.",
        why: "Your answer already uses the target pattern correctly.",
        anotherExample: exercise.relatedExamples[0],
      },
      verdictSource: "rule_based",
      semanticAccepted: true,
      naturalnessAccepted: true,
      targetedPatternHandled: true,
      acceptedVariantType: "exact",
      mistakeAnalyses: [],
    };
  }

  const normalizedAcceptable = exercise.acceptableAnswers.map((answer) =>
    normalizeHebrewText(answer, {
      ignoreTerminalPeriod: gradingMode === "balanced",
    }),
  );

  if (normalizedAcceptable.includes(normalizedAnswer)) {
    return {
      isCorrect: true,
      score: 0.95,
      issues: [],
      feedbackSummary: "Accepted. Your answer is a valid variant.",
      correctedAnswer: exercise.targetAnswer,
      shouldCreateDerivedMistake: false,
      teaching: {
        yourAnswer: userAnswer,
        betterAnswer: exercise.targetAnswer,
        whatChanged: "The wording changes slightly, but the target form stays correct.",
        whyPreferred: "Hebrew allows more than one natural phrasing here, and your version is still acceptable.",
        why: "Your wording is different, but it still handles the target form correctly.",
        anotherExample: exercise.relatedExamples[0],
      },
      verdictSource: "rule_based",
      semanticAccepted: true,
      naturalnessAccepted: true,
      targetedPatternHandled: true,
      acceptedVariantType: "acceptable_variant",
      mistakeAnalyses: [],
    };
  }

  const mismatches = diffTokens(
    tokenizeHebrewText(normalizedTarget),
    tokenizeHebrewText(normalizedAnswer),
  );

  const issues: AttemptIssue[] = mismatches.slice(0, 3).map((mismatch) => {
    if (mismatch.kind === "missing") {
      return {
        code: "missing_fragment",
        message: "A required word is missing.",
        expectedFragment: mismatch.expected,
      };
    }

    if (mismatch.kind === "extra") {
      return {
        code: "near_miss",
        message: "There is an extra word.",
        actualFragment: mismatch.actual,
      };
    }

    const focusMismatch = exercise.focusTokens.includes(mismatch.expected ?? "");

    return {
      code: focusMismatch ? "wrong_fragment" : "spelling_error",
      message: "One word needs correction.",
      expectedFragment: mismatch.expected,
      actualFragment: mismatch.actual,
    };
  });

  return {
    isCorrect: false,
    score: Math.max(0.2, 1 - mismatches.length * 0.25),
    issues,
    feedbackSummary: issues.map(toIssueMessage).join(" "),
    correctedAnswer: exercise.targetAnswer,
    shouldCreateDerivedMistake: mismatches.length >= 2,
    teaching: {
      yourAnswer: userAnswer,
      betterAnswer: exercise.targetAnswer,
      whatChanged: "The corrected version replaces the weak fragment with the target form.",
      whyPreferred:
        exercise.explanation ||
        "Hebrew prefers the corrected form because it preserves the intended pattern and sounds more natural.",
      why:
        exercise.explanation ||
        "The corrected answer keeps the same meaning but fixes the target Hebrew pattern.",
      anotherExample: exercise.relatedExamples[0],
    },
    verdictSource: "rule_based",
    semanticAccepted: false,
    naturalnessAccepted: false,
    targetedPatternHandled: !issues.some((issue) => issue.code === "wrong_fragment"),
    mistakeAnalyses: [],
  };
}

export async function gradeExerciseAnswer(
  exercise: Exercise,
  userAnswer: string,
  options: GradeExerciseOptions = {},
): Promise<AttemptResult> {
  const gradingMode = options.gradingMode ?? "balanced";
  const gradingStrategy = options.gradingStrategy ?? "rule_based_only";
  const base = ruleBasedGradeExerciseAnswer(exercise, userAnswer, gradingMode);

  if (gradingStrategy === "rule_based_only" || !options.llmClient) {
    return base;
  }

  if (gradingStrategy === "hybrid_fallback" && base.isCorrect) {
    return base;
  }

  try {
    const llmResult = await options.llmClient.gradeAnswer({
      prompt: exercise.prompt,
      referenceAnswer: exercise.targetAnswer,
      acceptableAnswers: exercise.acceptableAnswers,
      userAnswer,
      meaningIntent: exercise.meaningIntent,
      focusTokens: exercise.focusTokens,
      practiceRoots: exercise.practiceRoots,
      explanation: exercise.explanation,
    });

    const shouldAccept =
      llmResult.isCorrect &&
      llmResult.semanticAccepted &&
      llmResult.targetedPatternHandled;

    if (gradingStrategy === "hybrid_fallback" && !shouldAccept) {
      return {
        ...base,
        feedbackSummary: llmResult.feedbackSummary || base.feedbackSummary,
      };
    }

    return {
      isCorrect: shouldAccept,
      score: llmResult.score,
      issues: llmResult.issues,
      feedbackSummary: llmResult.feedbackSummary,
      correctedAnswer: llmResult.correctedAnswer,
      shouldCreateDerivedMistake: !llmResult.targetedPatternHandled,
      teaching: normalizeTeachingPayload(
        userAnswer,
        llmResult.correctedAnswer,
        llmResult.teaching ?? {
          yourAnswer: userAnswer,
          betterAnswer: llmResult.correctedAnswer,
          whatChanged: "The revised sentence changes the problematic part of the answer.",
          whyPreferred: llmResult.feedbackSummary,
          why: llmResult.feedbackSummary,
          anotherExample: exercise.relatedExamples[0],
        },
      ),
      verdictSource: "llm",
      semanticAccepted: llmResult.semanticAccepted,
      naturalnessAccepted: llmResult.naturalnessAccepted,
      targetedPatternHandled: llmResult.targetedPatternHandled,
      acceptedVariantType: shouldAccept ? "llm_equivalent" : undefined,
      mistakeAnalyses: llmResult.mistakeAnalyses ?? [],
    };
  } catch {
    return base;
  }
}
