import type { GeneratedPracticeItem } from "../../llm/llm-client";

export interface AttemptIssue {
  code:
    | "spelling_error"
    | "wrong_fragment"
    | "missing_fragment"
    | "structure_error"
    | "register_mismatch"
    | "near_miss";
  message: string;
  expectedFragment?: string;
  actualFragment?: string;
}

export interface AttemptMistakeAnalysis {
  actualFragment: string;
  expectedFragment: string;
  issueCode: AttemptIssue["code"];
  shortExplanation: string;
  whyPreferred: string;
  practiceItems: GeneratedPracticeItem[];
}

export interface AttemptResult {
  isCorrect: boolean;
  score: number;
  issues: AttemptIssue[];
  feedbackSummary: string;
  correctedAnswer: string;
  shouldCreateDerivedMistake: boolean;
  teaching?: {
    yourAnswer: string;
    betterAnswer: string;
    whatChanged?: string;
    whyPreferred?: string;
    why: string;
    anotherExample?: string | null;
  };
  verdictSource?: "rule_based" | "llm";
  semanticAccepted?: boolean;
  naturalnessAccepted?: boolean;
  targetedPatternHandled?: boolean;
  acceptedVariantType?: "exact" | "acceptable_variant" | "llm_equivalent";
  mistakeAnalyses: AttemptMistakeAnalysis[];
}

export interface Attempt {
  id: string;
  sessionId: string;
  exerciseId: string;
  mistakeIds: string[];
  userAnswer: string;
  submittedAt: string;
  result: AttemptResult;
}
