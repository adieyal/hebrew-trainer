import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./AppShell";
import { ImportPage } from "../features/import/pages/ImportPage";
import { PracticePage } from "../features/practice/pages/PracticePage";
import { MistakeBankPage } from "../features/mistakes/pages/MistakeBankPage";
import { GeneratedDrillsPage } from "../features/generated-drills/pages/GeneratedDrillsPage";
import { InsightsPage } from "../features/insights/pages/InsightsPage";
import { HelpPage } from "../features/help/pages/HelpPage";
import { SettingsPage } from "../features/settings/pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <ImportPage /> },
      { path: "practice", element: <PracticePage /> },
      { path: "mistakes", element: <MistakeBankPage /> },
      { path: "generated-drills", element: <GeneratedDrillsPage /> },
      { path: "insights", element: <InsightsPage /> },
      { path: "help", element: <HelpPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);
