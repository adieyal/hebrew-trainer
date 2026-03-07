export function addDays(isoString: string, days: number): string {
  const date = new Date(isoString);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function isDue(nextReviewAt: string | undefined, nowIso: string): boolean {
  if (!nextReviewAt) {
    return true;
  }

  return new Date(nextReviewAt).getTime() <= new Date(nowIso).getTime();
}
