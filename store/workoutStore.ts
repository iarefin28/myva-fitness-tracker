import type {
    WorkoutActionLogEntry,
    WorkoutDraft,
    WorkoutExercise,
    WorkoutItem,
    WorkoutSaved,
    WorkoutState,
} from '@/types/workout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// helper
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

// small log helper (optional)
const pushLog = (d: WorkoutDraft, entry: Omit<WorkoutActionLogEntry, 'id' | 'at'>) => {
  const next: WorkoutActionLogEntry = { id: uid(), at: Date.now(), ...entry };
  return [...(d.actionLog ?? []), next];
};

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      draft: null,
      history: [],

      // --- basics (keep yours if already present) ---
      startDraft: (name) => {
        const d: WorkoutDraft = {
          id: uid(),
          name,
          startedAt: Date.now(),
          pausedAt: null,
          items: [],
          actionLog: [],
        };
        set({ draft: d });
      },

      setDraftName: (name) => {
        const d = get().draft; if (!d) return;
        set({ draft: { ...d, name } });
      },

      addExercise: (name, libId) => {
        const d = get().draft; if (!d) return '';
        const item: WorkoutExercise = {
          id: uid(),
          type: 'exercise',
          name,
          libId,
          status: 'inProgress',
          createdAt: Date.now(),
          sets: [],
        };
        set({
          draft: {
            ...d,
            items: [...d.items, item],
            actionLog: pushLog(d, { kind: 'add', itemId: item.id, payload: { type: 'exercise' } }),
          },
        });
        return item.id;
      },

      addNote: (text) => {
        const d = get().draft; if (!d) return '';
        const item: WorkoutItem = { id: uid(), type: 'note', text, createdAt: Date.now() };
        set({
          draft: {
            ...d,
            items: [...d.items, item],
            actionLog: pushLog(d, { kind: 'add', itemId: item.id, payload: { type: 'note' } }),
          },
        });
        return item.id;
      },

      addCustom: (text) => {
        const d = get().draft; if (!d) return '';
        const item: WorkoutItem = { id: uid(), type: 'custom', text, createdAt: Date.now() };
        set({
          draft: {
            ...d,
            items: [...d.items, item],
            actionLog: pushLog(d, { kind: 'add', itemId: item.id, payload: { type: 'custom' } }),
          },
        });
        return item.id;
      },

      updateItem: (id, next) => {
        const d = get().draft; if (!d) return false;
        const items = d.items.map((it) => {
          if (it.id !== id) return it;
          if (it.type === 'exercise' && next.name) return { ...it, name: next.name } as WorkoutExercise;
          if ((it.type === 'note' || it.type === 'custom') && next.text !== undefined) return { ...it, text: next.text } as any;
          return it;
        });
        set({ draft: { ...d, items, actionLog: pushLog(d, { kind: 'update', itemId: id, payload: next }) } });
        return true;
      },

      completeItem: (id) => {
        const d = get().draft; if (!d) return false;
        const items = d.items.map((it) => {
          if (it.id !== id) return it;
          if (it.type === 'exercise') return { ...it, status: 'completed' } as WorkoutExercise;
          return it;
        });
        set({ draft: { ...d, items, actionLog: pushLog(d, { kind: 'complete_item', itemId: id }) } });
        return true;
      },

      deleteItem: (id) => {
        const d = get().draft; if (!d) return false;
        const items = d.items.filter((it) => it.id !== id);
        set({ draft: { ...d, items, actionLog: pushLog(d, { kind: 'delete', itemId: id }) } });
        return true;
      },

      // --- NEW: Set APIs ---
      addExerciseSet: (exerciseId, plannedWeight, plannedReps) => {
        const d = get().draft; if (!d) return '';
        const setId = uid();
        const nextSet: WorkoutExerciseSet = {
          id: setId,
          plannedWeight,
          plannedReps,
          createdAt: Date.now(),
        };
        const items = d.items.map((it) => {
          if (it.id !== exerciseId || it.type !== 'exercise') return it;
          return { ...it, sets: [...it.sets, nextSet] } as WorkoutExercise;
        });
        set({
          draft: {
            ...d,
            items,
            actionLog: pushLog(d, { kind: 'exercise_add_set', itemId: exerciseId, payload: { setId } }),
          },
        });
        return setId;
      },

      completeExerciseSet: (exerciseId, setId, completedWeight, completedReps) => {
        const d = get().draft; if (!d) return false;
        const items = d.items.map((it) => {
          if (it.id !== exerciseId || it.type !== 'exercise') return it;
          const sets = it.sets.map((s) =>
            s.id === setId
              ? { ...s, completedWeight, completedReps, completedAt: Date.now() }
              : s
          );
          return { ...it, sets } as WorkoutExercise;
        });
        set({
          draft: {
            ...d,
            items,
            actionLog: pushLog(d, { kind: 'exercise_complete_set', itemId: exerciseId, payload: { setId } }),
          },
        });
        return true;
      },

      // Optional selector
      getExercise: (exerciseId) => {
        const d = get().draft; if (!d) return null;
        const it = d.items.find((i) => i.id === exerciseId && i.type === 'exercise') as WorkoutExercise | undefined;
        return it ?? null;
      },

      // --- timer / finish (keep your originals if already there) ---
      elapsedSeconds: () => {
        const d = get().draft; if (!d) return 0;
        const now = Date.now();
        if (d.pausedAt) return Math.floor((d.pausedAt - d.startedAt) / 1000);
        return Math.floor((now - d.startedAt) / 1000);
      },

      pause: () => {
        const d = get().draft; if (!d || d.pausedAt) return;
        set({ draft: { ...d, pausedAt: Date.now(), actionLog: pushLog(d, { kind: 'pause' }) } });
      },

      resume: () => {
        const d = get().draft; if (!d || !d.pausedAt) return;
        set({ draft: { ...d, pausedAt: null, actionLog: pushLog(d, { kind: 'resume' }) } });
      },

      finishAndSave: () => {
        const d = get().draft; if (!d) return { id: '' };
        const saved: WorkoutSaved = {
          id: uid(),
          name: d.name,
          startedAt: d.startedAt,
          endedAt: Date.now(),
          items: d.items,
        };
        set({ history: [saved, ...get().history], draft: null });
        return { id: saved.id };
      },

      clearDraft: () => set({ draft: null }),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'myva_workout_store_v5',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ draft: s.draft, history: s.history }),
      version: 5,
    }
  )
);
