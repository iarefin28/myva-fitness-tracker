export type WorkoutItemType = 'exercise' | 'note' | 'custom';

export interface WorkoutItemBase {
  id: string;
  type: WorkoutItemType;
  createdAt: number; // ms
}

export type ExerciseType = 'weighted' | 'bodyweight' | 'timed' | 'distance';
export type ExerciseEntryKind = 'set' | 'rest' | 'note';

export interface ExerciseSetWeighted {
  id: string;
  kind: 'set';
  weight: number;
  reps: number;
  createdAt: number;
  status: 'active' | 'completed';      // ← NEW
  completedAt?: number | null;         // ← NEW
}

export interface ExerciseRestEntry {
  id: string;
  kind: 'rest';
  seconds: number;
  createdAt: number;
}

export interface ExerciseNoteEntry {
  id: string;
  kind: 'note';
  text: string;
  createdAt: number;
}

export type ExerciseEntry = ExerciseSetWeighted | ExerciseRestEntry | ExerciseNoteEntry;


export interface UserExercise {
  id: string;
  uid: string;
  name: string;
  nameLower: string;
  type: ExerciseType;
  howTo?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  usageCount?: number;
  lastUsedAt?: number;
}

export interface WorkoutNote extends WorkoutItemBase {
  type: 'note';
  text: string;
}

export interface WorkoutExercise extends WorkoutItemBase {
  type: 'exercise';
  name: string;
  status: 'active' | 'completed';
  completedAt?: number | null;
  exerciseId?: string;
  entries?: ExerciseEntry[];
  activeEntryId?: string | null;   // ← pointer to the current set/rest/note on this exercise
}


export interface WorkoutCustom extends WorkoutItemBase {
  type: 'custom';
  text: string;
}

export type WorkoutItem = WorkoutNote | WorkoutExercise | WorkoutCustom;

export interface WorkoutActionLogEntry {
  id: string;
  at: number;
  kind: 'add' | 'edit' | 'complete' | 'delete'; // ← added delete
  itemId: string;
  payload?: any;
}

export interface WorkoutDraft {
  id: string;
  name: string;
  createdAt: number;
  items: WorkoutItem[];
  startedAt: number;
  pausedAt?: number | null;
  activeItemId?: string | null;
  actionLog?: WorkoutActionLogEntry[];
  ongoingRest?: { exerciseId: string; entryId: string; startedAt: number } | null; // ← simple rest tracker
}

export interface WorkoutSaved {
  id: string;
  name: string;
  createdAt: number;
  durationSec: number;
  items: WorkoutItem[];
  actionLog?: WorkoutActionLogEntry[];
}

export interface WorkoutState {
  draft: WorkoutDraft | null;
  history: WorkoutSaved[];

  elapsedSeconds: () => number;

  startDraft: (name?: string) => void;
  setDraftName: (name: string) => void;

  addNote: (text: string) => string;
  addExercise: (name: string, exerciseId?: string) => string;
  addCustom: (text: string) => string;

  updateItem: (id: string, next: { name?: string; text?: string }) => boolean;
  completeItem: (id: string) => boolean;
  deleteItem: (id: string) => boolean; // ← NEW
  setActiveItem: (id: string | null) => void;

  addWeightedSet: (exerciseId: string, weight: number, reps: number) => string;
  addExerciseRest: (exerciseId: string, seconds: number) => string;
  addExerciseNote: (exerciseId: string, text: string) => string;

  setActiveEntry: (exerciseId: string, entryId: string | null) => void;
  startRestForEntry: (exerciseId: string, entryId: string) => void;
  stopRest: () => void;

  pause: () => void;
  resume: () => void;

  finishAndSave: () => { id: string };
  clearDraft: () => void;

}
