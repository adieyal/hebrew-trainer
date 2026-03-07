import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { HighlightedAnswer } from "./feedback-highlighting";

describe("HighlightedAnswer", () => {
  test("does not include surrounding spaces inside a highlighted RTL token", () => {
    render(
      <HighlightedAnswer
        answer="אני לא אשקר, אני היף היום"
        betterAnswer="אני קצת עייף היום, לא אשקר."
        issues={[
          {
            code: "spelling_error",
            message: "The adjective is misspelled.",
            expectedFragment: "עייף",
            actualFragment: "היף",
          },
        ]}
      />,
    );

    const highlightedFragment = screen.getByText("היף");
    expect(highlightedFragment).toHaveTextContent(/^היף$/);
  });
});
