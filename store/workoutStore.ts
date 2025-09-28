import type {
    WorkoutDraft,
    WorkoutItem,
    WorkoutSaved,
    WorkoutState,
} from '@/types/workout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const makeDraft = (name: string): WorkoutDraft => ({
  id: uid(),
  name,
  createdAt: Date.now(),
  items: [],
  startedAt: Date.now(), // timer starts immediately
  pausedAt: null,
  activeItemId: null,
});

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      draft: null,
      history: [],

      elapsedSeconds: () => {
        const d = get().draft;
        if (!d) return 0;
        const stop = d.pausedAt ?? Date.now();
        return Math.max(0, Math.floor((stop - d.startedAt) / 1000));
      },

      startDraft: (name = '') => {
        if (get().draft) return;
        set({ draft: makeDraft(name) });
      },

      setDraftName: (name) => {
        const d = get().draft; if (!d) return;
        set({ draft: { ...d, name } });
      },

      addNote: (text) => {
        const d = get().draft; if (!d) return '';
        const item: WorkoutItem = { id: uid(), type: 'note', text, createdAt: Date.now() };
        const items = [...d.items, item];
        set({ draft: { ...d, items, activeItemId: item.id } });
        return item.id;
      },

      addExercise: (name) => {
        const d = get().draft; if (!d) return '';
        const item: WorkoutItem = { id: uid(), type: 'exercise', name, createdAt: Date.now() };
        const items = [...d.items, item];
        set({ draft: { ...d, items, activeItemId: item.id } });
        return item.id;
      },

      addCustom: (text) => {
        const d = get().draft; if (!d) return '';
        const item: WorkoutItem = { id: uid(), type: 'custom', text, createdAt: Date.now() };
        const items = [...d.items, item];
        set({ draft: { ...d, items, activeItemId: item.id } });
        return item.id;
      },

      // NEW: update an existing item by id
      updateItem: (id, next) => {
        const d = get().draft; if (!d) return false;
        let changed = false;
        const items = d.items.map((it) => {
          if (it.id !== id) return it;
          changed = true;
          if (it.type === 'exercise' && 'name' in next) return { ...it, name: next.name };
          if (it.type !== 'exercise' && 'text' in next) return { ...it, text: next.text };
          return it;
        });
        if (!changed) return false;
        set({ draft: { ...d, items, activeItemId: id } });
        return true;
      },

      setActiveItem: (id) => {
        const d = get().draft; if (!d) return;
        set({ draft: { ...d, activeItemId: id } });
      },

      pause: () => {
        const d = get().draft; if (!d || d.pausedAt) return;
        set({ draft: { ...d, pausedAt: Date.now() } });
      },
      resume: () => {
        const d = get().draft; if (!d || !d.pausedAt) return;
        const pausedFor = Date.now() - d.pausedAt;
        set({ draft: { ...d, startedAt: d.startedAt + pausedFor, pausedAt: null } });
      },

      finishAndSave: () => {
        const d = get().draft; if (!d) throw new Error('No active workout to finish');
        const durationSec = get().elapsedSeconds();
        const saved: WorkoutSaved = {
          id: d.id, name: d.name?.trim() || 'Workout', createdAt: d.createdAt, items: d.items, durationSec,
        };
        const history = [saved, ...get().history];
        set({ history, draft: null });
        return { id: saved.id };
      },

      clearDraft: () => set({ draft: null }),
    }),
    {
      name: 'myva_workout_store_v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ draft: s.draft, history: s.history }),
      version: 2,
      migrate: (p) => p as any,
    }
  )
);