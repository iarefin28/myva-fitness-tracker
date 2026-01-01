
import type { Exercise, SetAction, Workout } from '@/deprecated/workout-old';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { nanoid } from 'nanoid/non-secure';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { workoutService } from '../services/workoutService';

type WorkoutState = {
  draft: Workout | null;
  isSaving: boolean;
  error?: string | null;
};

type WorkoutActions = {
  startWorkout: (payload: { name: string; notes?: string }) => void;
  endWorkout: () => void;
  addExercise: (exercise: Omit<Exercise, 'id'>) => string;
  updateExercise: (exerciseId: string, patch: Partial<Exercise>) => void;
  removeExercise: (exerciseId: string) => void;

  addSet: (exerciseId: string, set: Omit<SetAction, 'id' | 'setNumber'>) => string;
  updateSet: (exerciseId: string, setId: string, patch: Partial<SetAction>) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  reorderSets: (exerciseId: string, orderedIds: string[]) => void;

  resetDraft: () => void;

  // Persistence to Firebase
  saveWorkout: (userId: string) => Promise<{ workoutId: string }>;
};

type WorkoutStore = WorkoutState & WorkoutActions;

const initialState: WorkoutState = {
  draft: null,
  isSaving: false,
  error: null,
};

export const useWorkoutStore = create<WorkoutStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        startWorkout: ({ name, notes }) => {
          const now = new Date().toISOString();
          const draft: Workout = {
            id: nanoid(),
            name,
            notes,
            startedAt: now,
            exercises: [],
            version: 1,
            source: 'local',
          };
          set({ draft, error: null });
        },

        endWorkout: () => {
          const { draft } = get();
          if (!draft) return;
          set({
            draft: { ...draft, finishedAt: new Date().toISOString() },
          });
        },

        addExercise: (exercise) => {
          const { draft } = get();
          if (!draft) throw new Error('No active workout draft');
          const id = nanoid();
          const ex: Exercise = { id, actions: [], ...exercise };
          set({
            draft: { ...draft, exercises: [...draft.exercises, ex] },
          });
          return id;
        },

        updateExercise: (exerciseId, patch) => {
          const { draft } = get();
          if (!draft) return;
          set({
            draft: {
              ...draft,
              exercises: draft.exercises.map((e) =>
                e.id === exerciseId ? { ...e, ...patch } : e
              ),
            },
          });
        },

        removeExercise: (exerciseId) => {
          const { draft } = get();
          if (!draft) return;
          set({
            draft: {
              ...draft,
              exercises: draft.exercises.filter((e) => e.id !== exerciseId),
            },
          });
        },

        addSet: (exerciseId, setInput) => {
          const { draft } = get();
          if (!draft) throw new Error('No active workout draft');

          const exercise = draft.exercises.find((e) => e.id === exerciseId);
          if (!exercise) throw new Error('Exercise not found');

          const id = nanoid();
          const setNumber = (exercise.actions?.length || 0) + 1;
          const action: SetAction = { id, type: 'set', setNumber, ...setInput };

          const updatedExercises = draft.exercises.map((e) =>
            e.id === exerciseId ? { ...e, actions: [...e.actions, action] } : e
          );

          set({ draft: { ...draft, exercises: updatedExercises } });
          return id;
        },

        updateSet: (exerciseId, setId, patch) => {
          const { draft } = get();
          if (!draft) return;

          set({
            draft: {
              ...draft,
              exercises: draft.exercises.map((e) => {
                if (e.id !== exerciseId) return e;
                return {
                  ...e,
                  actions: e.actions.map((a) =>
                    a.id === setId ? { ...a, ...patch } : a
                  ),
                };
              }),
            },
          });
        },

        removeSet: (exerciseId, setId) => {
          const { draft } = get();
          if (!draft) return;

          set({
            draft: {
              ...draft,
              exercises: draft.exercises.map((e) => {
                if (e.id !== exerciseId) return e;
                const next = e.actions.filter((a) => a.id !== setId);
                // re-number sets
                const renumbered = next.map((a, idx) => ({ ...a, setNumber: idx + 1 }));
                return { ...e, actions: renumbered };
              }),
            },
          });
        },

        reorderSets: (exerciseId, orderedIds) => {
          const { draft } = get();
          if (!draft) return;

          set({
            draft: {
              ...draft,
              exercises: draft.exercises.map((e) => {
                if (e.id !== exerciseId) return e;
                const map = new Map(e.actions.map((a) => [a.id, a]));
                const reordered = orderedIds
                  .map((id) => map.get(id))
                  .filter(Boolean) as SetAction[];
                const renumbered = reordered.map((a, idx) => ({ ...a, setNumber: idx + 1 }));
                return { ...e, actions: renumbered };
              }),
            },
          });
        },

        resetDraft: () => set({ draft: null, error: null }),

        saveWorkout: async (userId: string) => {
          const { draft } = get();
          if (!draft) throw new Error('No workout to save');

          set({ isSaving: true, error: null });

          try {
            const { id: localId } = draft;

            const { remoteId, serverTimestamps } =
              await workoutService.saveWorkout(userId, draft);

            // Mark as synced
            set({
              draft: {
                ...draft,
                userId,
                source: 'synced',
                createdAt: serverTimestamps.createdAt ?? draft.createdAt,
                updatedAt: serverTimestamps.updatedAt ?? new Date().toISOString(),
              },
              isSaving: false,
            });

            return { workoutId: remoteId ?? localId };
          } catch (e: any) {
            set({ isSaving: false, error: e?.message ?? 'Failed to save workout' });
            throw e;
          }
        },
      }),
      {
        name: 'myva-workout-draft',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({ draft: state.draft }), // only persist the draft
      }
    )
  )
);

