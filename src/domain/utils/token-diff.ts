export interface TokenMismatch {
  kind: "missing" | "extra" | "substitution";
  expected?: string;
  actual?: string;
  index: number;
}

export function diffTokens(expected: string[], actual: string[]): TokenMismatch[] {
  const mismatches: TokenMismatch[] = [];
  const maxLength = Math.max(expected.length, actual.length);

  for (let index = 0; index < maxLength; index += 1) {
    const expectedToken = expected[index];
    const actualToken = actual[index];

    if (expectedToken === actualToken) {
      continue;
    }

    if (expectedToken && actualToken) {
      mismatches.push({
        kind: "substitution",
        expected: expectedToken,
        actual: actualToken,
        index,
      });
      continue;
    }

    if (expectedToken) {
      mismatches.push({ kind: "missing", expected: expectedToken, index });
      continue;
    }

    mismatches.push({ kind: "extra", actual: actualToken, index });
  }

  return mismatches;
}
