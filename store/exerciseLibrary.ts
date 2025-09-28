// store/exerciseLibrary.ts
import {
    createUserExercise,
    listUserExercises
} from '@/services/exerciseService';
import type { ExerciseType, UserExercise } from '@/types/workout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type Dict<T> = Record<string, T>;

interface ExerciseLibraryState {
  ready: boolean;
  exercises: Dict<UserExercise>;  // id -> exercise
  byName: Dict<string>;           // nameLower -> id

  hydrateLibrary: (uid: string) => Promise<void>;
  searchLocal: (prefix: string, limit?: number) => UserExercise[];
  ensureExercise: (
    uid: string,
    name: string,
    dataIfNew: { type: ExerciseType; howTo?: string }
  ) => Promise<{ id: string; created: boolean; exercise: UserExercise }>;
}

export const useExerciseLibrary = create<ExerciseLibraryState>()(
  persist(
    (set, get) => ({
      ready: false,
      exercises: {},
      byName: {},

      async hydrateLibrary(uid) {
        if (!uid) return;
        const rows = await listUserExercises(uid, 200);
        const exercises: Dict<UserExercise> = {};
        const byName: Dict<string> = {};
        rows.forEach((e: any) => {
          exercises[e.id] = e as UserExercise;
          byName[(e.nameLower || e.name.toLowerCase())] = e.id;
        });
        set({ exercises, byName, ready: true });
      },

      searchLocal(prefix, limit = 8) {
        const key = prefix.trim().toLowerCase();
        if (!key) return [];
        const { exercises } = get();
        const all = Object.values(exercises);
        return all
          .filter(e => e.nameLower.startsWith(key))
          .sort((a, b) => a.name.localeCompare(b.name))
          .slice(0, limit);
      },

      async ensureExercise(uid, name, dataIfNew) {
        const key = name.trim().toLowerCase();
        const { byName, exercises } = get();
        const existingId = byName[key];
        if (existingId) {
          return { id: existingId, created: false, exercise: exercises[existingId] };
        }
        // Create remotely
        const created = await createUserExercise(uid, {
          name: name.trim(),
          type: dataIfNew.type,
          howTo: dataIfNew.howTo,
        });
        // Upsert locally
        set((s) => ({
          exercises: { ...s.exercises, [created.id]: created as UserExercise },
          byName: { ...s.byName, [created.nameLower]: created.id },
        }));
        return { id: created.id, created: true, exercise: created as UserExercise };
      },
    }),
    {
      name: 'myva_exercise_library_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ exercises: s.exercises, byName: s.byName, ready: s.ready }),
      version: 1,
    }
  )
);
