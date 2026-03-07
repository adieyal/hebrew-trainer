import { PropsWithChildren, useEffect } from "react";
import { createDefaultSettings } from "../domain/services/settings-service";
import { resolvePracticeFontStack } from "../features/settings/settings-utils";
import { settingsRepository } from "../storage/repositories/settings-repository";

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    void settingsRepository
      .getOrCreate(() => createDefaultSettings(new Date().toISOString()))
      .then((settings) => {
        document.documentElement.style.setProperty(
          "--font-hebrew-training",
          resolvePracticeFontStack(
            settings.typography.practiceFontPreset,
            settings.typography.customPracticeFont,
          ),
        );
      });
  }, []);

  return children;
}
