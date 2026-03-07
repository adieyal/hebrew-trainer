import type { Attempt } from "../../domain/models/attempt";
import { getTrainerDb } from "../db";

export const attemptRepository = {
  async list(): Promise<Attempt[]> {
    const database = await getTrainerDb();
    const attempts = await database.getAll("attempts");
    return attempts.sort((left, right) => left.submittedAt.localeCompare(right.submittedAt));
  },

  async listBySession(sessionId: string): Promise<Attempt[]> {
    const database = await getTrainerDb();
    return database.getAllFromIndex("attempts", "by-session", sessionId);
  },

  async save(attempt: Attempt): Promise<void> {
    const database = await getTrainerDb();
    await database.put("attempts", attempt);
  },
};
