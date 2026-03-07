import type { Attempt } from "../../domain/models/attempt";
import type { MistakeEntry } from "../../domain/models/mistake";
import type { PracticeSession } from "../../domain/models/session";
import type { AppSettings } from "../../domain/models/settings";
import { getTrainerDb } from "../../storage/db";

export interface ExportPayload {
  version: 1;
  exportedAt: string;
  mistakes: MistakeEntry[];
  attempts: Attempt[];
  sessions: PracticeSession[];
  settings?: AppSettings;
}

export async function exportTrainerData(nowIso: string): Promise<ExportPayload> {
  const database = await getTrainerDb();
  const [mistakes, attempts, sessions, settings] = await Promise.all([
    database.getAll("mistakes"),
    database.getAll("attempts"),
    database.getAll("sessions"),
    database.get("settings", "app_settings"),
  ]);

  return {
    version: 1,
    exportedAt: nowIso,
    mistakes,
    attempts,
    sessions,
    settings,
  };
}

export function validateImportPayload(value: unknown): value is ExportPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Partial<ExportPayload>;
  return (
    payload.version === 1 &&
    Array.isArray(payload.mistakes) &&
    Array.isArray(payload.attempts) &&
    Array.isArray(payload.sessions)
  );
}

export async function importTrainerData(payload: ExportPayload): Promise<void> {
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
  ]);

  await Promise.all([
    ...payload.mistakes.map((mistake) => transaction.objectStore("mistakes").put(mistake)),
    ...payload.attempts.map((attempt) => transaction.objectStore("attempts").put(attempt)),
    ...payload.sessions.map((session) => transaction.objectStore("sessions").put(session)),
  ]);

  if (payload.settings) {
    await transaction.objectStore("settings").put(payload.settings);
  }

  await transaction.done;
}

export async function clearTrainerProgress(): Promise<void> {
  const database = await getTrainerDb();
  const [mistakes, settings] = await Promise.all([
    database.getAll("mistakes"),
    database.get("settings", "app_settings"),
  ]);
  const transaction = database.transaction(
    ["mistakes", "attempts", "sessions", "settings"],
    "readwrite",
  );

  await Promise.all([
    transaction.objectStore("mistakes").clear(),
    transaction.objectStore("attempts").clear(),
    transaction.objectStore("sessions").clear(),
  ]);

  await Promise.all(
    mistakes.map((mistake) =>
      transaction.objectStore("mistakes").put({
        ...mistake,
        stats: createResetStats(mistake),
      }),
    ),
  );

  if (settings) {
    await transaction.objectStore("settings").put(settings);
  }

  await transaction.done;
}

function createResetStats(mistake: MistakeEntry): MistakeEntry["stats"] {
  return {
    attempts: 0,
    correctCount: 0,
    streak: 0,
    relapseCount: 0,
    mastery: 0,
    masteryBand: "new",
    weaknessScore: 1,
    exposureCount: 0,
    recentFocuses: [...mistake.focusTokens],
  };
}
