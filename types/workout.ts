export type WorkoutItemType = 'exercise' | 'note' | 'custom';

export interface WorkoutItemBase {
  id: string;
  type: WorkoutItemType;
  createdAt: number; // ms
}

export interface WorkoutNote extends WorkoutItemBase {
  type: 'note';
  text: string;
}

export interface WorkoutExercise extends WorkoutItemBase {
  type: 'exercise';
  name: string;
}

export interface WorkoutCustom extends WorkoutItemBase {
  type: 'custom';
  text: string;
}

export type WorkoutItem = WorkoutNote | WorkoutExercise | WorkoutCustom;

export interface WorkoutDraft {
  id: string;
  name: string;
  createdAt: number;
  items: WorkoutItem[];
  startedAt: number;
  pausedAt?: number | null; // NEW
}

export interface WorkoutSaved {
  id: string;
  name: string;
  createdAt: number; // ms
  durationSec: number;
  items: WorkoutItem[];
}

export interface WorkoutState {
  draft: WorkoutDraft | null;
  history: WorkoutSaved[];

  // computed helpers
  elapsedSeconds: () => number;

  // actions
  startDraft: (name?: string) => void;
  setDraftName: (name: string) => void;
  addNote: (text: string) => void;
  addExercise: (name: string) => void;
  addCustom: (text: string) => void;

  finishAndSave: () => { id: string };
  clearDraft: () => void;
}
