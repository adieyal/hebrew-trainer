import type { Exercise } from "./exercise";

export interface PracticeSession {
  id: string;
  createdAt: string;
  completedAt?: string;
  requestedSize: number;
  exerciseIds: string[];
  currentIndex: number;
}

export interface PracticeSessionBundle {
  session: PracticeSession;
  exercises: Exercise[];
}
