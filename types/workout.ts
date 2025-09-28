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
  createdAt: number; // ms
  items: WorkoutItem[];
  startedAt: number; // ms (when the workout started)
  pausedAt?: number | null; // when paused, else null/undefined

  // Pointer to the "current" item in this workout (usually latest)
  activeItemId?: string | null;
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

  addNote: (text: string) => string;      // returns new id
  addExercise: (name: string) => string;  // returns new id
  addCustom: (text: string) => string;    // returns new id

  setActiveItem: (id: string | null) => void;

  // timer control
  pause: () => void;
  resume: () => void;

  // finalize (not used while disabled in UI)
  finishAndSave: () => { id: string };
  clearDraft: () => void;
}
