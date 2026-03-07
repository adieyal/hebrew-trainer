export function normalizeHebrewText(
  value: string,
  options: { ignoreTerminalPeriod?: boolean } = {},
): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  const compactPunctuation = trimmed.replace(/\s*([,.!?:;])\s*/g, "$1 ");
  const normalized = compactPunctuation.replace(/\s+/g, " ").trim();

  if (options.ignoreTerminalPeriod) {
    return normalized.replace(/[.]$/, "");
  }

  return normalized;
}

export function tokenizeHebrewText(value: string): string[] {
  return normalizeHebrewText(value)
    .split(" ")
    .filter(Boolean);
}
