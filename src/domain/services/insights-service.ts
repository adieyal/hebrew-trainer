import type { Attempt } from "../models/attempt";
import type { MistakeEntry, MistakeTag } from "../models/mistake";

export interface InsightsSnapshot {
  totalMistakes: number;
  dueCount: number;
  relapsedCount: number;
  averageMastery: number;
  weakCategories: { tag: MistakeTag; failures: number }[];
}

export function deriveInsights(
  mistakes: MistakeEntry[],
  attempts: Attempt[],
  nowIso: string,
): InsightsSnapshot {
  const practicedMistakes = mistakes.filter(
    (item) => !item.derivedFrom && item.stats.attempts > 0,
  );
  const practicedMistakeIds = new Set(practicedMistakes.map((item) => item.id));
  const failureByTag = new Map<MistakeTag, number>();

  for (const attempt of attempts.filter((item) => !item.result.isCorrect)) {
    for (const mistakeId of attempt.mistakeIds) {
      if (!practicedMistakeIds.has(mistakeId)) {
        continue;
      }

      const mistake = practicedMistakes.find((entry) => entry.id === mistakeId);
      if (!mistake) {
        continue;
      }

      for (const tag of mistake.tags) {
        failureByTag.set(tag, (failureByTag.get(tag) ?? 0) + 1);
      }
    }
  }

  const weakCategories = Array.from(failureByTag.entries())
    .map(([tag, failures]) => ({ tag, failures }))
    .sort((left, right) => right.failures - left.failures)
    .slice(0, 4);

  const averageMastery =
    practicedMistakes.length === 0
      ? 0
      : Number(
          (
            practicedMistakes.reduce((sum, item) => sum + item.stats.mastery, 0) /
            practicedMistakes.length
          ).toFixed(2),
        );

  return {
    totalMistakes: practicedMistakes.length,
    dueCount: practicedMistakes.filter((item) => {
      if (!item.stats.nextReviewAt) {
        return true;
      }

      return new Date(item.stats.nextReviewAt).getTime() <= new Date(nowIso).getTime();
    }).length,
    relapsedCount: practicedMistakes.filter((item) => item.stats.relapseCount > 0).length,
    averageMastery,
    weakCategories,
  };
}
