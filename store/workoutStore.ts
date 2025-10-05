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

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const log = (draft: WorkoutDraft, entry: Omit<WorkoutActionLogEntry, 'id' | 'at'>): WorkoutActionLogEntry[] => {
    const list = draft.actionLog ?? [];
    return [...list, { id: uid(), at: Date.now(), ...entry }];
};

const makeDraft = (name: string): WorkoutDraft => ({
    id: uid(),
    name,
    createdAt: Date.now(),
    items: [],
    startedAt: Date.now(),
    pausedAt: null,
    activeItemId: null,
    actionLog: [],
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

            // Adds
            addNote: (text) => {
                const d = get().draft; if (!d) return '';
                const item: WorkoutItem = { id: uid(), type: 'note', text, createdAt: Date.now() };
                set({ draft: { ...d, items: [...d.items, item], activeItemId: item.id, actionLog: log(d, { kind: 'add', itemId: item.id, payload: { type: 'note' } }) } });
                return item.id;
            },
            addExercise: (name: string, exerciseId?: string) => {
                const d = get().draft; if (!d) return '';
                const item: WorkoutExercise = {
                    id: uid(),
                    type: 'exercise',
                    name,
                    createdAt: Date.now(),
                    status: 'active',
                    completedAt: null,
                    exerciseId,          // optional, fine if undefined
                    entries: [],         // if you want to start empty
                    activeEntryId: null, // if you track a pointer
                };
                const items = [...d.items, item];
                set({ draft: { ...d, items, activeItemId: item.id } });
                return item.id;
            },
            addCustom: (text) => {
                const d = get().draft; if (!d) return '';
                const item: WorkoutItem = { id: uid(), type: 'custom', text, createdAt: Date.now() };
                set({ draft: { ...d, items: [...d.items, item], activeItemId: item.id, actionLog: log(d, { kind: 'add', itemId: item.id, payload: { type: 'custom' } }) } });
                return item.id;
            },

            // Updates / complete / delete
            updateItem: (id, next) => {
                const d = get().draft; if (!d) return false;
                let changed = false; let payload: any = {};
                const items = d.items.map((it) => {
                    if (it.id !== id) return it;
                    if (it.type === 'exercise' && it.status === 'completed') return it; // lock
                    if (it.type === 'exercise' && 'name' in next && typeof next.name === 'string') {
                        const to = next.name.trim(); if (!to || to === (it as WorkoutExercise).name) return it;
                        payload = { nameFrom: (it as WorkoutExercise).name, nameTo: to };
                        changed = true;
                        return { ...(it as WorkoutExercise), name: to };
                    }
                    if (it.type !== 'exercise' && 'text' in next && typeof next.text === 'string') {
                        const from = (it as any).text ?? '';
                        const to = next.text.trim(); if (to === from) return it;
                        payload = { textFrom: from, textTo: to };
                        changed = true;
                        return { ...(it as any), text: to };
                    }
                    return it;
                });
                if (!changed) return false;
                set({ draft: { ...d, items, activeItemId: id, actionLog: log(d, { kind: 'edit', itemId: id, payload }) } });
                return true;
            },

            completeItem: (id) => {
                const d = get().draft; if (!d) return false;
                let changed = false;
                const items = d.items.map((it) => {
                    if (it.id !== id || it.type !== 'exercise') return it;
                    if (it.status === 'completed') return it;
                    changed = true;
                    return { ...(it as WorkoutExercise), status: 'completed', completedAt: Date.now() };
                });
                if (!changed) return false;
                set({ draft: { ...d, items, activeItemId: id, actionLog: log(d, { kind: 'complete', itemId: id }) } });
                return true;
            },

            deleteItem: (id) => {
                const d = get().draft; if (!d) return false;
                const exists = d.items.some(i => i.id === id);
                if (!exists) return false;
                const items = d.items.filter(i => i.id !== id);
                // choose new active pointer: last item or null
                const activeItemId = items.length ? items[items.length - 1].id : null;
                set({ draft: { ...d, items, activeItemId, actionLog: log(d, { kind: 'delete', itemId: id }) } });
                return true;
            },

            setActiveItem: (id) => {
                const d = get().draft; if (!d) return;
                set({ draft: { ...d, activeItemId: id } });
            },

            // Timer
            pause: () => {
                const d = get().draft; if (!d || d.pausedAt) return;
                set({ draft: { ...d, pausedAt: Date.now() } });
            },
            resume: () => {
                const d = get().draft; if (!d || !d.pausedAt) return;
                const pausedFor = Date.now() - d.pausedAt;
                set({ draft: { ...d, startedAt: d.startedAt + pausedFor, pausedAt: null } });
            },

            // Finalize (kept for later)
            finishAndSave: () => {
                const d = get().draft; if (!d) throw new Error('No active workout to finish');
                const durationSec = get().elapsedSeconds();
                const saved: WorkoutSaved = {
                    id: d.id, name: d.name?.trim() || 'Workout', createdAt: d.createdAt, items: d.items, durationSec, actionLog: d.actionLog,
                };
                const history = [saved, ...get().history];
                set({ history, draft: null });
                return { id: saved.id };
            },

            clearDraft: () => set({ draft: null }),
        }),
        {
            name: 'myva_workout_store_v4',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (s) => ({ draft: s.draft, history: s.history }),
            version: 4,
            migrate: (p) => p as any,
        }
    )
);
