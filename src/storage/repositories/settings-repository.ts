import type { AppSettings } from "../../domain/models/settings";
import { normalizeAppSettings } from "../../domain/services/settings-service";
import { getTrainerDb } from "../db";

export const settingsRepository = {
  async get(): Promise<AppSettings | undefined> {
    const database = await getTrainerDb();
    const settings = await database.get("settings", "app_settings");
    return settings ? normalizeAppSettings(settings) : undefined;
  },

  async save(settings: AppSettings): Promise<void> {
    const database = await getTrainerDb();
    await database.put("settings", normalizeAppSettings(settings));
  },

  async getOrCreate(factory: () => AppSettings): Promise<AppSettings> {
    const existing = await this.get();
    if (existing) {
      return existing;
    }

    const created = factory();
    await this.save(created);
    return created;
  },
};
