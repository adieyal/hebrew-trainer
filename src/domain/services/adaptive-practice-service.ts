import type { MistakeEntry } from "../models/mistake";
import { isDue } from "../utils/dates";

function adaptiveWeight(mistake: MistakeEntry, nowIso: string): number {
  let weight = mistake.stats.weaknessScore;

  if (isDue(mistake.stats.nextReviewAt, nowIso)) {
    weight += 0.35;
  }

  weight += mistake.stats.relapseCount * 0.08;
  weight -= Math.min(0.25, mistake.stats.exposureCount * 0.03);

  return weight;
}

export function selectPracticeMistakes(
  mistakes: MistakeEntry[],
  count: number,
  nowIso: string,
): MistakeEntry[] {
  return [...mistakes]
    .sort((left, right) => adaptiveWeight(right, nowIso) - adaptiveWeight(left, nowIso))
    .slice(0, count);
}
