// --- Types for the set flow (planned vs actual) ---

export type ExerciseType = 'weighted' | 'bodyweight' | 'timed' | 'distance';

export interface UserExercise {
  id: string;
  uid?: string;
  name: string;
  nameLower: string;
  type: ExerciseType;
  howTo?: string;
  createdBy?: string;
  createdByUid?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  usageCount: number;
  lastUsedAt: number | null;
}

export type WorkoutItemType = 'exercise' | 'note' | 'custom';

export interface WorkoutItemBase {
  id: string;
  type: WorkoutItemType;
  createdAt: number; // ms
}

export type ExerciseStatus = 'inProgress' | 'completed';

export interface WorkoutExerciseSet {
  id: string;
  plannedWeight: number;
  plannedReps: number;
  createdAt: number;

  completedWeight?: number;
  completedReps?: number;
  completedAt?: number; // ms when completed
}

export interface WorkoutExercise extends WorkoutItemBase {
  type: 'exercise';
  name: string;
  libId?: string;          // optional reference to library exercise
  status: ExerciseStatus;  // inProgress | completed
  sets: WorkoutExerciseSet[];
}

export interface WorkoutNote extends WorkoutItemBase {
  type: 'note';
  text: string;
}

export interface WorkoutCustom extends WorkoutItemBase {
  type: 'custom';
  text: string;
}

export type WorkoutItem = WorkoutExercise | WorkoutNote | WorkoutCustom;

export interface WorkoutDraft {
  id: string;
  name: string;
  startedAt: number;           // timer anchor
  pausedAt?: number | null;
  items: WorkoutItem[];
  actionLog?: WorkoutActionLogEntry[];
}

export interface WorkoutSaved {
  id: string;
  name: string;
  startedAt: number;
  endedAt: number;
  items: WorkoutItem[];
}

export interface WorkoutActionLogEntry {
  id: string;
  at: number; // ms
  kind:
    | 'start'
    | 'pause'
    | 'resume'
    | 'add'
    | 'update'
    | 'delete'
    | 'complete_item'
    | 'exercise_add_set'
    | 'exercise_complete_set';
  itemId?: string;
  payload?: any;
}

export interface WorkoutState {
  draft: WorkoutDraft | null;
  history: WorkoutSaved[];

  // basic flows
  startDraft: (name: string) => void;
  setDraftName: (name: string) => void;

  addExercise: (name: string, libId?: string) => string;
  addNote: (text: string) => string;
  addCustom: (text: string) => string;

  updateItem: (id: string, next: { name?: string; text?: string }) => boolean;
  completeItem: (id: string) => boolean;
  deleteItem: (id: string) => boolean;

  // timer controls
  elapsedSeconds: () => number;
  pause: () => void;
  resume: () => void;

  // finish & clear
  finishAndSave: () => { id: string };
  clearDraft: () => void;
  clearHistory: () => void;

  // --- NEW: exercise set API ---
  addExerciseSet: (exerciseId: string, plannedWeight: number, plannedReps: number) => string;
  completeExerciseSet: (exerciseId: string, setId: string, completedWeight: number, completedReps: number) => boolean;

  // convenient selector (optional)
  getExercise: (exerciseId: string) => WorkoutExercise | null;
}
