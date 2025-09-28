import type {
    WorkoutDraft,
    WorkoutItem,
    WorkoutSaved,
    WorkoutState,
} from '@/types/workout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const makeDraft = (name: string): WorkoutDraft => ({
  id: uid(),
  name,
  createdAt: Date.now(),
  items: [],
  startedAt: Date.now(),
  // @ts-expect-error extend: pausedAt optional
  pausedAt: null,
});

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      draft: null,
      history: [],

      elapsedSeconds: () => {
        const d = get().draft as (WorkoutDraft & { pausedAt?: number | null }) | null;
        if (!d) return 0;
        const stop = d.pausedAt ?? Date.now();
        return Math.max(0, Math.floor((stop - d.startedAt) / 1000));
      },

      startDraft: (name = '') => {
        if (get().draft) return;
        set({ draft: makeDraft(name) });
      },

      setDraftName: (name: string) => {
        const d = get().draft as (WorkoutDraft & { pausedAt?: number | null }) | null;
        if (!d) return;
        set({ draft: { ...d, name } });
      },

      addNote: (text: string) => {
        const d = get().draft as (WorkoutDraft & { pausedAt?: number | null }) | null;
        if (!d) return;
        const item: WorkoutItem = { id: uid(), type: 'note', text, createdAt: Date.now() };
        set({ draft: { ...d, items: [...d.items, item] } });
      },

      addExercise: (name: string) => {
        const d = get().draft as (WorkoutDraft & { pausedAt?: number | null }) | null;
        if (!d) return;
        const item: WorkoutItem = { id: uid(), type: 'exercise', name, createdAt: Date.now() };
        set({ draft: { ...d, items: [...d.items, item] } });
      },

      addCustom: (text: string) => {
        const d = get().draft as (WorkoutDraft & { pausedAt?: number | null }) | null;
        if (!d) return;
        const item: WorkoutItem = { id: uid(), type: 'custom', text, createdAt: Date.now() };
        set({ draft: { ...d, items: [...d.items, item] } });
      },

      // NEW: pause / resume
      pause: () => {
        const d = get().draft as (WorkoutDraft & { pausedAt?: number | null }) | null;
        if (!d || d.pausedAt) return;
        set({ draft: { ...d, pausedAt: Date.now() } });
      },
      resume: () => {
        const d = get().draft as (WorkoutDraft & { pausedAt?: number | null }) | null;
        if (!d || !d.pausedAt) return;
        const pausedFor = Date.now() - d.pausedAt;
        set({
          draft: {
            ...d,
            startedAt: d.startedAt + pausedFor, // shift start so elapsed ignores paused span
            pausedAt: null,
          },
        });
      },

      finishAndSave: () => {
        // keep available for later; not used while disabled in UI
        const d = get().draft as (WorkoutDraft & { pausedAt?: number | null }) | null;
        if (!d) throw new Error('No active workout to finish');
        const durationSec = get().elapsedSeconds();
        const saved: WorkoutSaved = {
          id: d.id,
          name: d.name?.trim() || 'Workout',
          createdAt: d.createdAt,
          items: d.items,
          durationSec,
        };
        const history = [saved, ...get().history];
        set({ history, draft: null });
        return { id: saved.id };
      },

      clearDraft: () => set({ draft: null }),
    }),
    {
      name: 'myva_workout_store_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        draft: s.draft,
        history: s.history,
      }),
      version: 2,
      migrate: (persisted, _v) => persisted as any,
    }
  )
);
