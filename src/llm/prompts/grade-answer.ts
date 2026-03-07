import type { LlmGradeInput } from "../llm-client";

export function buildGradeAnswerPrompt(input: LlmGradeInput): string {
  return [
    "You evaluate Hebrew learner answers for meaning, naturalness, and target-pattern correctness.",
    "Return JSON only.",
    `Prompt: ${input.prompt}`,
    `Reference answer: ${input.referenceAnswer}`,
    `Acceptable answers: ${JSON.stringify(input.acceptableAnswers)}`,
    `User answer: ${input.userAnswer}`,
    `Meaning intent: ${input.meaningIntent ?? ""}`,
    `Focus tokens: ${JSON.stringify(input.focusTokens)}`,
    `Practice roots: ${JSON.stringify(input.practiceRoots)}`,
    `Rule note: ${input.explanation ?? ""}`,
    "Write all explanations in English. Only use Hebrew for the actual learner fragments, corrected constructions, or example sentences being taught.",
    "feedbackSummary should be short and learner-friendly.",
    "If the user's answer is already fully correct, do not describe the betterAnswer as better. Keep betterAnswer identical to the userAnswer/reference and explain that it is already correct.",
    "If the user answer and betterAnswer are effectively the same sentence, the teaching.why must confirm correctness rather than imply improvement.",
    "If the answer is not fully correct, teaching.whatChanged must clearly contrast the learner sentence with the corrected wording.",
    "If the answer is not fully correct, teaching.whyPreferred must explain why Hebrew prefers the corrected form.",
    "teaching.why should be a short one- or two-sentence teaching summary.",
    "If the answer is not fully correct, teaching.anotherExample should reuse the same target pattern in a fresh sentence.",
    "If the answer contains mistakes, add mistakeAnalyses with one object per specific mistake, not one object for the whole sentence.",
    "Each mistakeAnalyses item must include: actualFragment, expectedFragment, issueCode, shortExplanation, whyPreferred, practiceItems.",
    "Each practiceItems item must include: English prompt, primary Hebrew reference, acceptable Hebrew variants, focus tokens, and practice roots.",
    "Each mistake should include 2 to 4 future practice items unless the answer is already fully correct.",
    "Required JSON keys: isCorrect, score, feedbackSummary, correctedAnswer, teaching, semanticAccepted, naturalnessAccepted, targetedPatternHandled, issues, mistakeAnalyses",
    "teaching must include: yourAnswer, betterAnswer, whatChanged, whyPreferred, why, anotherExample",
  ].join("\n");
}
