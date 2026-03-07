import type { PracticeSession } from "../../domain/models/session";
import { getTrainerDb } from "../db";

export const sessionRepository = {
  async list(): Promise<PracticeSession[]> {
    const database = await getTrainerDb();
    const sessions = await database.getAll("sessions");
    return sessions.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  },

  async get(id: string): Promise<PracticeSession | undefined> {
    const database = await getTrainerDb();
    return database.get("sessions", id);
  },

  async save(session: PracticeSession): Promise<void> {
    const database = await getTrainerDb();
    await database.put("sessions", session);
  },
};
