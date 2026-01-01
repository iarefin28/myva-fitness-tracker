// store/exerciseLibrary.ts
import { EXERCISES_DB } from '@/data/exerciseData';
import { EXERCISE_TYPE_MAP } from '@/data/exerciseTypeMap';
import {
  createUserExercise,
  listUserExercises
} from '@/services/exerciseService';
import type { ExerciseType, UserExercise } from '@/types/workout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type Dict<T> = Record<string, T>;

const hashName = (value: string) => {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
};

const defaultIdForName = (name: string) => {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return `def_${slug}_${hashName(name)}`;
};

const normalizeType = (name: string): ExerciseType => {
  const raw = EXERCISE_TYPE_MAP[name];
  if (!raw) return 'free weight';
  if (raw === 'bodyweight') return 'bodyweight';
  if (raw === 'machine') return 'machine';
  return 'free weight';
};

interface ExerciseLibraryState {
  ready: boolean;
  exercises: Dict<UserExercise>;  // id -> exercise
  byName: Dict<string>;           // nameLower -> id

  ensureDefaults: () => void;
  hydrateLibrary: (uid: string) => Promise<void>;
  searchLocal: (prefix: string, limit?: number) => UserExercise[];
  ensureLocalExercise: (
    name: string,
    dataIfNew: { type: ExerciseType; howTo?: string; createdBy?: string; createdByUid?: string }
  ) => Promise<{ id: string; created: boolean; exercise: UserExercise }>;
  ensureExercise: (
    uid: string,
    name: string,
    dataIfNew: { type: ExerciseType; howTo?: string; createdBy?: string; createdByUid?: string }
  ) => Promise<{ id: string; created: boolean; exercise: UserExercise }>;
}

export const useExerciseLibrary = create<ExerciseLibraryState>()(
  persist(
    (set, get) => ({
      ready: false,
      exercises: {},
      byName: {},

      ensureDefaults() {
        const { exercises, byName } = get();
        const nextExercises: Dict<UserExercise> = { ...exercises };
        const nextByName: Dict<string> = { ...byName };
        const now = Date.now();
        let changed = false;

        EXERCISES_DB.forEach((name) => {
          const trimmed = name.trim();
          const key = trimmed.toLowerCase();
          if (!key || nextByName[key]) return;
          const id = defaultIdForName(trimmed);
          nextExercises[id] = {
            id,
            name: trimmed,
            nameLower: key,
            type: normalizeType(trimmed),
            howTo: '',
            createdBy: 'MYVA',
            tags: [],
            createdAt: now,
            updatedAt: now,
            usageCount: 0,
            lastUsedAt: null,
          };
          nextByName[key] = id;
          changed = true;
        });

        if (changed || !get().ready) {
          set({ exercises: nextExercises, byName: nextByName, ready: true });
        }
      },

      async hydrateLibrary(uid) {
        if (!uid) {
          get().ensureDefaults();
          return;
        }
        const rows = await listUserExercises(uid, 200);
        const exercises: Dict<UserExercise> = {};
        const byName: Dict<string> = {};
        rows.forEach((e: any) => {
          exercises[e.id] = e as UserExercise;
          byName[(e.nameLower || e.name.toLowerCase())] = e.id;
        });
        set({ exercises, byName, ready: true });
        get().ensureDefaults();
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

      async ensureLocalExercise(name, dataIfNew) {
        const key = name.trim().toLowerCase();
        const { byName, exercises } = get();
        const existingId = byName[key];
        if (existingId) {
          return { id: existingId, created: false, exercise: exercises[existingId] };
        }
        const now = Date.now();
        const id = `local_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
        const created: UserExercise = {
          id,
          name: name.trim(),
          nameLower: key,
          type: dataIfNew.type,
          howTo: dataIfNew.howTo?.trim() || '',
          createdBy: dataIfNew.createdBy,
          createdByUid: dataIfNew.createdByUid,
          tags: [],
          createdAt: now,
          updatedAt: now,
          usageCount: 0,
          lastUsedAt: null,
        };
        set((s) => ({
          exercises: { ...s.exercises, [created.id]: created },
          byName: { ...s.byName, [created.nameLower]: created.id },
          ready: true,
        }));
        return { id: created.id, created: true, exercise: created };
      },

      async ensureExercise(uid, name, dataIfNew) {
        if (!uid) return get().ensureLocalExercise(name, dataIfNew);
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
      onRehydrateStorage: () => (state) => {
        state?.ensureDefaults();
      },
    }
  )
);
