import { create } from 'zustand';

type LiveState = {
    isActive: boolean;
    startedAt: number | null;   // when this run began
    elapsedMs: number;          // live-updated for UI
    start: () => void;
    stop: () => void;
    tick: () => void;
};

export const useLiveWorkout = create<LiveState>((set, get) => ({
    isActive: false,
    startedAt: null,
    elapsedMs: 0,

    start: () => {
        const { isActive, startedAt } = get();
        if (isActive && startedAt) return; // already running
        set({
            isActive: true,
            startedAt: Date.now(),
            elapsedMs: 0, // keep if first start; safe because of guard above
        });
    },

    stop: () => {
        set({
            isActive: false,
            startedAt: null,
            elapsedMs: 0,
        });
    },

    // called by a 1s global ticker
    tick: () => {
        const { isActive, startedAt } = get();
        if (!isActive || !startedAt) return;
        set({ elapsedMs: Date.now() - startedAt });
    },
}));
