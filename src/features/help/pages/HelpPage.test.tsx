import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { HelpPage } from "./HelpPage";

describe("HelpPage", () => {
  test("explains the tool, import flow, and backup warning", () => {
    render(<HelpPage />);

    expect(
      screen.getByText(/what this trainer is for and how to use it well/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/a practice desk, not a course/i)).toBeInTheDocument();
    expect(screen.getByText(/generate hebrew and save/i)).toBeInTheDocument();
    expect(
      screen.getByText(/your data is stored locally in the browser on this device/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/treat the app as ephemeral local storage unless you export backups/i)).toBeInTheDocument();
    expect(screen.getByText(/settings/i)).toBeInTheDocument();
  });
});
