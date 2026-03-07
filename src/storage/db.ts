import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Attempt } from "../domain/models/attempt";
import type { MistakeEntry } from "../domain/models/mistake";
import type { PracticeSession } from "../domain/models/session";
import type { AppSettings } from "../domain/models/settings";

interface TrainerDbSchema extends DBSchema {
  mistakes: {
    key: string;
    value: MistakeEntry;
  };
  attempts: {
    key: string;
    value: Attempt;
    indexes: { "by-session": string };
  };
  sessions: {
    key: string;
    value: PracticeSession;
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

const DB_NAME = "hebrew-trainer";
const DB_VERSION = 1;

let databasePromise: Promise<IDBPDatabase<TrainerDbSchema>> | undefined;

export function getTrainerDb(): Promise<IDBPDatabase<TrainerDbSchema>> {
  if (!databasePromise) {
    databasePromise = openDB<TrainerDbSchema>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains("mistakes")) {
          database.createObjectStore("mistakes", { keyPath: "id" });
        }

        if (!database.objectStoreNames.contains("attempts")) {
          const attempts = database.createObjectStore("attempts", { keyPath: "id" });
          attempts.createIndex("by-session", "sessionId");
        }

        if (!database.objectStoreNames.contains("sessions")) {
          database.createObjectStore("sessions", { keyPath: "id" });
        }

        if (!database.objectStoreNames.contains("settings")) {
          database.createObjectStore("settings", { keyPath: "id" });
        }
      },
    });
  }

  return databasePromise;
}

export async function resetTrainerDb(): Promise<void> {
  const database = await getTrainerDb();
  const transaction = database.transaction(
    ["mistakes", "attempts", "sessions", "settings"],
    "readwrite",
  );

  await Promise.all([
    transaction.objectStore("mistakes").clear(),
    transaction.objectStore("attempts").clear(),
    transaction.objectStore("sessions").clear(),
    transaction.objectStore("settings").clear(),
    transaction.done,
  ]);
}
