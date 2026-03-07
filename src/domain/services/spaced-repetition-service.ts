import type { AttemptResult } from "../models/attempt";
import type { MasteryBand, MistakeEntry } from "../models/mistake";
import { addDays } from "../utils/dates";

function masteryBandFor(value: number): MasteryBand {
  if (value >= 0.85) {
    return "solid";
  }

  if (value >= 0.65) {
    return "building";
  }

  if (value >= 0.4) {
    return "fragile";
  }

  return "new";
}

export function applyAttemptToMistake(
  mistake: MistakeEntry,
  result: AttemptResult,
  nowIso: string,
): MistakeEntry {
  const nextAttempts = mistake.stats.attempts + 1;
  const nextCorrectCount = mistake.stats.correctCount + (result.isCorrect ? 1 : 0);
  const nextStreak = result.isCorrect ? mistake.stats.streak + 1 : 0;
  const relapseCount =
    !result.isCorrect && mistake.stats.streak >= 2
      ? mistake.stats.relapseCount + 1
      : mistake.stats.relapseCount;
  const mastery = Number((nextCorrectCount / nextAttempts).toFixed(2));
  const nextReviewGap = result.isCorrect ? Math.max(1, nextStreak * 2) : 1;
  const weaknessScore = Number(
    Math.max(
      0.1,
      Math.min(
        1,
        mistake.stats.weaknessScore + (result.isCorrect ? -0.12 : 0.18),
      ),
    ).toFixed(2),
  );

  return {
    ...mistake,
    updatedAt: nowIso,
    stats: {
      attempts: nextAttempts,
      correctCount: nextCorrectCount,
      streak: nextStreak,
      relapseCount,
      mastery,
      masteryBand: masteryBandFor(mastery),
      weaknessScore,
      exposureCount: mistake.stats.exposureCount + 1,
      recentFocuses: mistake.focusTokens.slice(0, 3),
      lastAttemptAt: nowIso,
      nextReviewAt: addDays(nowIso, nextReviewGap),
    },
  };
}
