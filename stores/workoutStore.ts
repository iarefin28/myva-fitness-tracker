// workoutStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type Exercise = any; // use your real type

type LiveMeta = {
  workoutName: string;
  preWorkoutNote: string;
  postWorkoutNote: string;
  status: 'active' | 'completed' | 'abandoned';
};

type Store = {
  // existing timer fields you already have:
  isActive: boolean;
  startedAt: number | null;
  elapsedMs: number;
  start: () => void;
  stop: () => void;
  tick: () => void;

  // ⬇️ NEW: live meta
  liveMeta: LiveMeta;
  setWorkoutName: (name: string) => void;
  setPreNote: (note: string) => void;
  setPostNote: (note: string) => void;
  setStatus: (s: LiveMeta['status']) => void;

  // existing exercises slice you already added:
  liveExercises: Exercise[];
  setAllLiveExercises: (list: Exercise[]) => void;
  pushLiveExercise: (ex: Exercise) => void;
  replaceLiveExerciseAt: (i: number, ex: Exercise) => void;
  removeLiveExerciseAt: (i: number) => void;
  clearLiveExercises: () => void;

  // (optional) template slice … unchanged
};

export const useWorkoutStore = create<Store>()(
  persist(
    (set, get) => ({
      // ----- timer -----
      isActive: false,
      startedAt: null,
      elapsedMs: 0,
      start: () => {
        const s = get();
        if (s.isActive && s.startedAt) return;
        set({
          isActive: true,
          startedAt: Date.now(),
          elapsedMs: 0,
          liveMeta: { ...s.liveMeta, status: 'active' },
        });
      },
      stop: () => {
        const s = get();
        set({
          isActive: false,
          startedAt: null,
          elapsedMs: 0,
          liveMeta: { ...s.liveMeta, status: 'abandoned' }, // set 'completed' in your save flow
        });
      },
      tick: () => {
        const s = get();
        if (!s.isActive || !s.startedAt) return;
        set({ elapsedMs: Date.now() - s.startedAt });
      },

      // ----- NEW: live meta -----
      liveMeta: {
        workoutName: '',
        preWorkoutNote: '',
        postWorkoutNote: '',
        status: 'abandoned',
      },
      setWorkoutName: (workoutName) => set((s) => ({ liveMeta: { ...s.liveMeta, workoutName } })),
      setPreNote: (preWorkoutNote) => set((s) => ({ liveMeta: { ...s.liveMeta, preWorkoutNote } })),
      setPostNote: (postWorkoutNote) => set((s) => ({ liveMeta: { ...s.liveMeta, postWorkoutNote } })),
      setStatus: (status) => set((s) => ({ liveMeta: { ...s.liveMeta, status } })),

      // ----- live exercises (you already had) -----
      liveExercises: [],
      setAllLiveExercises: (list) => set({ liveExercises: list ?? [] }),
      pushLiveExercise: (ex) => set((s) => ({ liveExercises: [...s.liveExercises, ex] })),
      replaceLiveExerciseAt: (i, ex) =>
        set((s) => {
          if (i < 0 || i >= s.liveExercises.length) return s;
          const next = [...s.liveExercises];
          next[i] = ex;
          return { liveExercises: next };
        }),
      removeLiveExerciseAt: (i) =>
        set((s) => ({ liveExercises: s.liveExercises.filter((_, idx) => idx !== i) })),
      clearLiveExercises: () => set({ liveExercises: [] }),
    }),
    {
      name: 'myva-workout-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        // Persist what’s needed to resume:
        isActive: s.isActive,
        startedAt: s.startedAt,
        elapsedMs: s.elapsedMs,
        liveMeta: s.liveMeta,          // ⬅️ keep name/notes/status across launches
        liveExercises: s.liveExercises,
      }),
    }
  )
);
