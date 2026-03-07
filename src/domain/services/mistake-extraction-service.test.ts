import { describe, expect, test } from "vitest";
import { parseCorrections } from "./mistake-extraction-service";

describe("parseCorrections", () => {
  test("extracts plain english prompts line by line", () => {
    const candidates = parseCorrections(`
Can you get here before one?
She said she would call tomorrow.
`);

    expect(candidates).toHaveLength(2);
    expect(candidates[0]?.englishPrompt).toBe("Can you get here before one?");
    expect(candidates[0]?.correctedText).toBe("");
  });

  test("extracts explicit Original/Corrected pairs", () => {
    const candidates = parseCorrections(`
Original: אתה יכול לגיע לפני אחד?
Corrected: אתה יכול להגיע לפני אחת?
`);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.sourceText).toBe("אתה יכול לגיע לפני אחד?");
    expect(candidates[0]?.correctedText).toBe("אתה יכול להגיע לפני אחת?");
    expect(candidates[0]?.tags).toContain("time_expression");
  });

  test("extracts arrow pairs line by line", () => {
    const candidates = parseCorrections("מא איתך? -> מה איתך?");

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.confidence).toBe(0.92);
  });

  test("conservatively extracts a transcript pair", () => {
    const candidates = parseCorrections(`
correct my hebrew: מא איתך?
הנה גרסה מתוקנת:
מה איתך?
`);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.confidence).toBeLessThan(0.8);
  });
});
