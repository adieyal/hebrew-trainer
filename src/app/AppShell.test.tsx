import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { AppShell } from "./AppShell";

function renderShellAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <AppShell />,
        children: [
          { index: true, element: <div>Import page</div> },
          { path: "practice", element: <div>Practice page</div> },
          { path: "help", element: <div>Help page</div> },
        ],
      },
    ],
    {
      initialEntries: [path],
    },
  );

  return render(<RouterProvider router={router} />);
}

describe("AppShell", () => {
  test("uses a compact shell on the practice route", async () => {
    renderShellAt("/practice");

    expect(screen.getByRole("navigation", { name: /primary/i })).toBeInTheDocument();
    expect(screen.getByText(/practice page/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/practice the hebrew mistakes you actually make/i),
    ).not.toBeInTheDocument();
  });

  test("keeps the larger hero shell on non-practice routes", async () => {
    renderShellAt("/");

    expect(
      screen.getByText(/practice the hebrew mistakes you actually make/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/import page/i)).toBeInTheDocument();
  });

  test("shows help in the primary navigation", async () => {
    renderShellAt("/help");

    expect(screen.getByRole("link", { name: /help/i })).toBeInTheDocument();
    expect(screen.getByText(/help page/i)).toBeInTheDocument();
  });
});
