export type ExerciseType =
  | "fix_the_hebrew"
  | "translate_to_hebrew"
  | "context_response"
  | "minimal_pair"
  | "tone_shift";

export interface Exercise {
  id: string;
  type: ExerciseType;
  prompt: string;
  subPrompt?: string;
  hint?: string;
  presentedText?: string;
  targetAnswer: string;
  acceptableAnswers: string[];
  meaningIntent?: string;
  focusTokens: string[];
  practiceRoots: string[];
  allowsFreeVariation: boolean;
  explanation: string;
  reminders: string[];
  relatedExamples: string[];
  sourceMistakeIds: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
}
