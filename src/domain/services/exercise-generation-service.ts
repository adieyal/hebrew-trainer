import type { Exercise } from "../models/exercise";
import type { MistakeEntry } from "../models/mistake";
import { createId } from "../utils/ids";

function inferDifficulty(mistake: MistakeEntry): 1 | 2 | 3 | 4 | 5 {
  if (mistake.stats.weaknessScore >= 0.85 || mistake.stats.relapseCount >= 3) {
    return 4;
  }

  if (mistake.tags.includes("direct_translation") || mistake.tags.includes("register_mismatch")) {
    return 3;
  }

  return 2;
}

function buildExercise(
  mistake: MistakeEntry,
  base: Pick<
    Exercise,
    | "type"
    | "prompt"
    | "subPrompt"
    | "presentedText"
    | "targetAnswer"
    | "meaningIntent"
    | "explanation"
    | "reminders"
  >,
): Exercise {
  const targetAnswer = mistake.primaryTranslation ?? mistake.correctedText;
  const acceptableAnswers =
    mistake.acceptableTranslations && mistake.acceptableTranslations.length > 0
      ? mistake.acceptableTranslations
      : targetAnswer
        ? [targetAnswer]
        : [];

  return {
    id: createId("exercise"),
    acceptableAnswers,
    allowsFreeVariation: true,
    focusTokens: mistake.focusTokens,
    practiceRoots: Array.from(
      new Set([...(mistake.practiceRoots ?? []), ...mistake.focusTokens, ...mistake.adjacentTokens]),
    ).slice(0, 4),
    relatedExamples:
      acceptableAnswers.length > 0 ? acceptableAnswers.slice(0, 4) : mistake.adjacentTokens,
    sourceMistakeIds: [mistake.id],
    difficulty: inferDifficulty(mistake),
    ...base,
  };
}

function buildVariationPrompt(mistake: MistakeEntry, variantIndex: number): string {
  const focus = mistake.focusTokens.join(" / ");
  const variants = [
    `Write a fresh sentence that correctly uses ${focus}.`,
    `Use ${focus} in a short realistic message.`,
    `Write a different sentence that keeps ${focus} natural and accurate.`,
    `Use ${focus} in a reply someone could actually send.`,
  ];

  return variants[variantIndex % variants.length]!;
}

export function generateExerciseFromMistake(mistake: MistakeEntry): Exercise {
  const targetAnswer = mistake.primaryTranslation ?? mistake.correctedText;

  if (mistake.englishPrompt) {
    return buildExercise(mistake, {
      type: "translate_to_hebrew",
      prompt: "Translate this into natural Hebrew.",
      presentedText: mistake.englishPrompt,
      targetAnswer,
      meaningIntent: mistake.englishPrompt,
      explanation:
        mistake.ruleNote ?? "Express the English meaning in natural, idiomatic Hebrew.",
      reminders: ["Natural Hebrew wording is allowed.", "You do not need to match one exact sentence."],
    });
  }

  if (mistake.tags.includes("direct_translation")) {
    return buildExercise(mistake, {
      type: "context_response",
      prompt: "Write this idea in natural Hebrew.",
      subPrompt: mistake.sourceText,
      targetAnswer,
      meaningIntent: mistake.sourceText ?? mistake.correctedText,
      explanation: mistake.ruleNote ?? "Use a natural Hebrew phrasing, not a literal translation.",
      reminders: ["Keep the response concise.", "Prefer natural collocations."],
    });
  }

  if (mistake.tags.includes("register_mismatch")) {
    return buildExercise(mistake, {
      type: "tone_shift",
      prompt: "Rewrite this in a more natural register.",
      subPrompt: mistake.sourceText ?? mistake.correctedText,
      targetAnswer,
      meaningIntent: mistake.correctedText,
      explanation: mistake.ruleNote ?? "Match the requested tone without changing the meaning.",
      reminders: ["Keep the intended meaning.", "Adjust the tone, not the facts."],
    });
  }

  if (mistake.tags.includes("time_expression") || mistake.tags.includes("gender_number")) {
    return buildExercise(mistake, {
      type: "minimal_pair",
      prompt: "Type a natural sentence that uses the correct form.",
      presentedText: mistake.sourceText,
      targetAnswer,
      meaningIntent: mistake.correctedText,
      explanation: mistake.ruleNote ?? "Choose the correct time and gender form.",
      reminders: ["You can vary the sentence wording.", "Use the target form correctly."],
    });
  }

  return buildExercise(mistake, {
    type: "fix_the_hebrew",
    prompt: "Write a natural corrected version of this idea.",
    presentedText: mistake.sourceText ?? mistake.correctedText,
    targetAnswer,
    meaningIntent: mistake.correctedText,
    explanation: mistake.ruleNote ?? "Fix the target pattern while keeping the sentence meaning.",
    reminders: ["Natural wording is allowed.", "Avoid the original mistake pattern."],
  });
}

export function generateRuleBasedVariationExercise(mistake: MistakeEntry): Exercise {
  const base = generateExerciseFromMistake(mistake);

  if (mistake.englishPrompt) {
    return {
      ...base,
      id: createId("exercise"),
      prompt: "Translate this idea into a natural Hebrew sentence.",
      meaningIntent: mistake.englishPrompt,
      presentedText: mistake.englishPrompt,
    };
  }

  if (mistake.focusTokens.length === 0) {
    return base;
  }

  return {
    ...base,
    id: createId("exercise"),
    prompt: buildVariationPrompt(mistake, 0),
    subPrompt: undefined,
    presentedText: undefined,
    meaningIntent: `Use the target form naturally in a new sentence: ${mistake.focusTokens.join(", ")}`,
  };
}

export function generateVariationPool(mistake: MistakeEntry, size = 4): Exercise[] {
  const base = generateExerciseFromMistake(mistake);
  const pool = [base];

  for (let index = 0; index < size - 1; index += 1) {
    pool.push({
      ...generateRuleBasedVariationExercise(mistake),
      id: createId("exercise"),
      prompt: buildVariationPrompt(mistake, index),
      relatedExamples: [
        ...mistake.adjacentTokens.slice(index, index + 2),
        ...base.relatedExamples,
      ].slice(0, 4),
    });
  }

  return pool;
}

function interleaveExercisePools(pools: Exercise[][], count: number): Exercise[] {
  const result: Exercise[] = [];
  const seenTargets = new Set<string>();
  let index = 0;

  while (result.length < count) {
    let addedInRound = false;

    for (const pool of pools) {
      const exercise = pool[index];
      if (!exercise) {
        continue;
      }

      const dedupeKey = `${exercise.sourceMistakeIds.join(",")}::${exercise.prompt}::${exercise.targetAnswer}`;
      if (seenTargets.has(dedupeKey)) {
        continue;
      }

      result.push(exercise);
      seenTargets.add(dedupeKey);
      addedInRound = true;

      if (result.length >= count) {
        break;
      }
    }

    if (!addedInRound) {
      break;
    }

    index += 1;
  }

  return result;
}

export function generatePracticeSet(mistakes: MistakeEntry[], count: number): Exercise[] {
  const pools = mistakes.map((mistake) => generateVariationPool(mistake, 4));
  return interleaveExercisePools(pools, count);
}
