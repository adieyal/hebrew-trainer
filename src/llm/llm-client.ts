import type { AttemptIssue } from "../domain/models/attempt";
import type { Exercise, ExerciseType } from "../domain/models/exercise";
import type { ContextTag, MistakeEntry, Register } from "../domain/models/mistake";

export interface GeneratedPracticeItem {
  englishPrompt: string;
  primaryTranslation: string;
  acceptableTranslations: string[];
  focusTokens: string[];
  practiceRoots: string[];
  register?: Register;
  contexts?: ContextTag[];
}

export interface MistakeAnalysis {
  actualFragment: string;
  expectedFragment: string;
  issueCode: AttemptIssue["code"];
  shortExplanation: string;
  whyPreferred: string;
  practiceItems: GeneratedPracticeItem[];
}

export interface LlmGradeInput {
  prompt: string;
  referenceAnswer: string;
  acceptableAnswers: string[];
  userAnswer: string;
  meaningIntent?: string;
  focusTokens: string[];
  practiceRoots: string[];
  explanation?: string;
}

export interface LlmGradeOutput {
  isCorrect: boolean;
  score: number;
  feedbackSummary: string;
  correctedAnswer: string;
  teaching?: {
    yourAnswer: string;
    betterAnswer: string;
    whatChanged?: string;
    whyPreferred?: string;
    why: string;
    anotherExample?: string | null;
  };
  semanticAccepted: boolean;
  naturalnessAccepted: boolean;
  targetedPatternHandled: boolean;
  issues: AttemptIssue[];
  mistakeAnalyses: MistakeAnalysis[];
}

export interface LlmGenerateVariationInput {
  mistake: MistakeEntry;
  count: number;
  preferredTypes: ExerciseType[];
}

export interface LlmGenerateTranslationReferenceInput {
  englishPrompt: string;
  register?: Register;
  contexts?: ContextTag[];
}

export interface LlmGenerateTranslationReferenceOutput {
  primaryTranslation: string;
  acceptableTranslations: string[];
  focusTokens: string[];
  practiceRoots: string[];
  register?: Register;
  contexts?: ContextTag[];
  ruleNote?: string;
}

export interface LlmClient {
  gradeAnswer(input: LlmGradeInput): Promise<LlmGradeOutput>;
  generateTranslationReference(
    input: LlmGenerateTranslationReferenceInput,
  ): Promise<LlmGenerateTranslationReferenceOutput>;
  generateVariationExercises(
    input: LlmGenerateVariationInput,
  ): Promise<Exercise[]>;
}
