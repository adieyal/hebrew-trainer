import type { MistakeEntry } from "../../domain/models/mistake";
import { normalizeHebrewText } from "../../domain/utils/hebrew-normalize";
import { getTrainerDb } from "../db";

function normalizeEnglishPrompt(value: string | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeTranslationForDeduplication(value: string | undefined): string {
  return normalizeHebrewText(value ?? "", {
    ignoreTerminalPeriod: true,
  }).replace(/[!?]$/, "");
}

export const mistakeRepository = {
  async list(): Promise<MistakeEntry[]> {
    const database = await getTrainerDb();
    const mistakes = await database.getAll("mistakes");
    return mistakes.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  },

  async get(id: string): Promise<MistakeEntry | undefined> {
    const database = await getTrainerDb();
    return database.get("mistakes", id);
  },

  async upsert(mistake: MistakeEntry): Promise<void> {
    const database = await getTrainerDb();
    await database.put("mistakes", mistake);
  },

  async bulkUpsert(mistakes: MistakeEntry[]): Promise<void> {
    const database = await getTrainerDb();
    const transaction = database.transaction("mistakes", "readwrite");
    await Promise.all(mistakes.map((mistake) => transaction.store.put(mistake)));
    await transaction.done;
  },

  async findByPromptAndTranslation(
    englishPrompt: string,
    primaryTranslation: string,
  ): Promise<MistakeEntry | undefined> {
    const normalizedPrompt = normalizeEnglishPrompt(englishPrompt);
    const normalizedTranslation = normalizeTranslationForDeduplication(primaryTranslation);
    const mistakes = await this.list();

    return mistakes.find((mistake) => {
      if (!mistake.englishPrompt || !mistake.primaryTranslation) {
        return false;
      }

      return (
        normalizeEnglishPrompt(mistake.englishPrompt) === normalizedPrompt &&
        normalizeTranslationForDeduplication(mistake.primaryTranslation) ===
          normalizedTranslation
      );
    });
  },
};
