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
  status: 'active' | 'completed';
  completedAt?: number | null;
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
  addExercise: (name: string) => string;
  addCustom: (text: string) => string;

  updateItem: (id: string, next: { name?: string; text?: string }) => boolean;
  completeItem: (id: string) => boolean;
  deleteItem: (id: string) => boolean; // ← NEW
  setActiveItem: (id: string | null) => void;

  pause: () => void;
  resume: () => void;

  finishAndSave: () => { id: string };
  clearDraft: () => void;
}
