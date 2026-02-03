import type {
  WorkoutDraft,
  WorkoutExercise,
  WorkoutExerciseSet,
  WorkoutItem,
  WorkoutSaved,
  WorkoutState,
} from '@/types/workout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// helper
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      draft: null,
      history: [],

      // --- Draft Management --- 
      startDraft: (name) => {
        const d: WorkoutDraft = {
          id: uid(),
          name,
          startedAt: Date.now(),
          pausedAt: null,
          lastActionAt: Date.now(),
          items: [],
        };
        set({ draft: d });
      },

      setDraftName: (name) => {
        const d = get().draft; if (!d) return;
        set({ draft: { ...d, name, lastActionAt: Date.now() } });
      },

      // --- Top Level Workout Item APIs --- 
      addExercise: (name, libId, exerciseType) => {
        const d = get().draft; if (!d) return '';
        const item: WorkoutExercise = {
          id: uid(),
          type: 'exercise',
          name,
          libId,
          exerciseType: exerciseType ?? 'free weight',
          status: 'inProgress',
          createdAt: Date.now(),
          sets: [],
        };
        set({
          draft: {
            ...d,
            lastActionAt: Date.now(),
            items: [...d.items, item],
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
            lastActionAt: Date.now(),
            items: [...d.items, item],
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
            lastActionAt: Date.now(),
            items: [...d.items, item],
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
        set({ draft: { ...d, items, lastActionAt: Date.now() } });
        return true;
      },

      completeItem: (id) => {
        const d = get().draft; if (!d) return false;
        const items = d.items.map((it) => {
          if (it.id !== id) return it;
          if (it.type === 'exercise') return { ...it, status: 'completed' } as WorkoutExercise;
          return it;
        });
        set({ draft: { ...d, items, lastActionAt: Date.now() } });
        return true;
      },

      deleteItem: (id) => {
        const d = get().draft; if (!d) return false;
        const items = d.items.filter((it) => it.id !== id);
        set({ draft: { ...d, items, lastActionAt: Date.now() } });
        return true;
      },

      // --- Exercise-specific APIs --- 
      addExerciseSet: (exerciseId, actualWeight, actualReps) => {
        const d = get().draft; if (!d) return '';
        const setId = uid();
        const nextSet: WorkoutExerciseSet = {
          id: setId,
          actualWeight,
          actualReps,
          createdAt: Date.now(),
        };
        const items = d.items.map((it) => {
          if (it.id !== exerciseId || it.type !== 'exercise') return it;
          return { ...it, sets: [...it.sets, nextSet] } as WorkoutExercise;
        });
        set({ draft: { ...d, items, lastActionAt: Date.now() } });
        return setId;
      },

      undoLastAction: () => {
        const d = get().draft; if (!d) return false;
        let latestSet: { exerciseId: string; setId: string; createdAt: number } | null = null;
        let latestNote: { exerciseId: string; noteId: string; createdAt: number } | null = null;
        let latestSetNote: { exerciseId: string; setId: string; noteId: string; createdAt: number } | null = null;

        d.items.forEach((it) => {
          if (it.type !== 'exercise') return;
          it.sets.forEach((s) => {
            if (!latestSet || s.createdAt > latestSet.createdAt) {
              latestSet = { exerciseId: it.id, setId: s.id, createdAt: s.createdAt };
            }
            (s.setNotes ?? []).forEach((n) => {
              if (!latestSetNote || n.createdAt > latestSetNote.createdAt) {
                latestSetNote = { exerciseId: it.id, setId: s.id, noteId: n.id, createdAt: n.createdAt };
              }
            });
          });
          (it.generalNotes ?? []).forEach((n) => {
            if (!latestNote || n.createdAt > latestNote.createdAt) {
              latestNote = { exerciseId: it.id, noteId: n.id, createdAt: n.createdAt };
            }
          });
        });

        if (!latestSet && !latestNote && !latestSetNote) return false;
        const latestSetCreated = latestSet?.createdAt ?? -1;
        const latestGeneralCreated = latestNote?.createdAt ?? -1;
        const latestSetNoteCreated = latestSetNote?.createdAt ?? -1;
        const latest = Math.max(latestSetCreated, latestGeneralCreated, latestSetNoteCreated);
        const shouldRemoveSetNote = latestSetNote && latestSetNote.createdAt === latest;
        const shouldRemoveNote =
          !shouldRemoveSetNote &&
          latestNote &&
          latestNote.createdAt === latest;
        const items = d.items.map((it) => {
          if (it.type !== 'exercise') return it;
          if (shouldRemoveSetNote) {
            if (it.id !== latestSetNote!.exerciseId) return it;
            const sets = it.sets.map((s) => {
              if (s.id !== latestSetNote!.setId) return s;
              return { ...s, setNotes: (s.setNotes ?? []).filter((n) => n.id !== latestSetNote!.noteId) };
            });
            return { ...it, sets } as WorkoutExercise;
          }
          if (shouldRemoveNote) {
            if (it.id !== latestNote!.exerciseId) return it;
            return {
              ...it,
              generalNotes: (it.generalNotes ?? []).filter((n) => n.id !== latestNote!.noteId),
            } as WorkoutExercise;
          }
          if (it.id !== latestSet!.exerciseId) return it;
          return { ...it, sets: it.sets.filter((s) => s.id !== latestSet!.setId) } as WorkoutExercise;
        });
        set({ draft: { ...d, items, lastActionAt: Date.now() } });
        return true;
      },

      updateExerciseSet: (exerciseId, setId, next) => {
        const d = get().draft; if (!d) return false;
        const items = d.items.map((it) => {
          if (it.id !== exerciseId || it.type !== 'exercise') return it;
          const sets = it.sets.map((s) => {
            if (s.id !== setId) return s;
            return {
              ...s,
              ...(next.actualWeight !== undefined ? { actualWeight: next.actualWeight } : {}),
              ...(next.actualReps !== undefined ? { actualReps: next.actualReps } : {}),
              ...(next.note !== undefined ? { note: next.note } : {}),
            };
          });
          return { ...it, sets } as WorkoutExercise;
        });
        set({ draft: { ...d, items, lastActionAt: Date.now() } });
        return true;
      },

      updateExerciseNote: (exerciseId, note) => {
        const d = get().draft; if (!d) return false;
        const items = d.items.map((it) => {
          if (it.id !== exerciseId || it.type !== 'exercise') return it;
          return { ...it, note } as WorkoutExercise;
        });
        set({ draft: { ...d, items, lastActionAt: Date.now() } });
        return true;
      },

      addExerciseGeneralNote: (exerciseId, note) => {
        const d = get().draft; if (!d) return false;
        const items = d.items.map((it) => {
          if (it.id !== exerciseId || it.type !== 'exercise') return it;
          const nextNotes = [...(it.generalNotes ?? []), note];
          return { ...it, generalNotes: nextNotes } as WorkoutExercise;
        });
        set({ draft: { ...d, items, lastActionAt: Date.now() } });
        return true;
      },

      updateExerciseGeneralNote: (exerciseId, noteId, text) => {
        const d = get().draft; if (!d) return false;
        const items = d.items.map((it) => {
          if (it.id !== exerciseId || it.type !== 'exercise') return it;
          const nextNotes = (it.generalNotes ?? []).map((n) =>
            n.id === noteId ? { ...n, text } : n
          );
          return { ...it, generalNotes: nextNotes } as WorkoutExercise;
        });
        set({ draft: { ...d, items, lastActionAt: Date.now() } });
        return true;
      },

      removeExerciseGeneralNote: (exerciseId, noteId) => {
        const d = get().draft; if (!d) return false;
        const items = d.items.map((it) => {
          if (it.id !== exerciseId || it.type !== 'exercise') return it;
          const nextNotes = (it.generalNotes ?? []).filter((n) => n.id !== noteId);
          return { ...it, generalNotes: nextNotes } as WorkoutExercise;
        });
        set({ draft: { ...d, items, lastActionAt: Date.now() } });
        return true;
      },

      addExerciseSetNote: (exerciseId, setId, note) => {
        const d = get().draft; if (!d) return false;
        const items = d.items.map((it) => {
          if (it.id !== exerciseId || it.type !== 'exercise') return it;
          const sets = it.sets.map((s) => {
            if (s.id !== setId) return s;
            const nextNotes = [...(s.setNotes ?? []), note];
            return { ...s, setNotes: nextNotes };
          });
          return { ...it, sets } as WorkoutExercise;
        });
        set({ draft: { ...d, items, lastActionAt: Date.now() } });
        return true;
      },

      updateExerciseSetNote: (exerciseId, setId, noteId, text) => {
        const d = get().draft; if (!d) return false;
        const items = d.items.map((it) => {
          if (it.id !== exerciseId || it.type !== 'exercise') return it;
          const sets = it.sets.map((s) => {
            if (s.id !== setId) return s;
            const nextNotes = (s.setNotes ?? []).map((n) =>
              n.id === noteId ? { ...n, text } : n
            );
            return { ...s, setNotes: nextNotes };
          });
          return { ...it, sets } as WorkoutExercise;
        });
        set({ draft: { ...d, items, lastActionAt: Date.now() } });
        return true;
      },

      removeExerciseSetNote: (exerciseId, setId, noteId) => {
        const d = get().draft; if (!d) return false;
        const items = d.items.map((it) => {
          if (it.id !== exerciseId || it.type !== 'exercise') return it;
          const sets = it.sets.map((s) => {
            if (s.id !== setId) return s;
            const nextNotes = (s.setNotes ?? []).filter((n) => n.id !== noteId);
            return { ...s, setNotes: nextNotes };
          });
          return { ...it, sets } as WorkoutExercise;
        });
        set({ draft: { ...d, items, lastActionAt: Date.now() } });
        return true;
      },

      // Optional selector
      getExercise: (exerciseId) => {
        const d = get().draft; if (!d) return null;
        const it = d.items.find((i) => i.id === exerciseId && i.type === 'exercise') as WorkoutExercise | undefined;
        return it ?? null;
      },

      // --- Timer, Pause, and Finish APIs ---
      elapsedSeconds: () => {
        const d = get().draft; if (!d) return 0;
        const now = Date.now();
        if (d.pausedAt) return Math.floor((d.pausedAt - d.startedAt) / 1000);
        return Math.floor((now - d.startedAt) / 1000);
      },

      pause: () => {
        const d = get().draft; if (!d || d.pausedAt) return;
        set({ draft: { ...d, pausedAt: Date.now(), lastActionAt: Date.now() } });
      },

      resume: () => {
        const d = get().draft; if (!d || !d.pausedAt) return;
        const pausedForMs = Date.now() - d.pausedAt;
        set({
          draft: {
            ...d,
            pausedAt: null,
            startedAt: d.startedAt + pausedForMs,
            lastActionAt: Date.now(),
          },
        });
      },

      finishAndSave: () => {
        const d = get().draft; if (!d) return { id: '' };
        const trimmedName = d.name.trim();
        const defaultName = `Workout on ${new Date(d.startedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}`;
        const saved: WorkoutSaved = {
          id: uid(),
          name: trimmedName.length ? trimmedName : defaultName,
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
      version: 6,
    }
  )
);
