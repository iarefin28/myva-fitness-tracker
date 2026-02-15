// store/mobilityMovementLibrary.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type Dict<T> = Record<string, T>;

export type MobilityMetric = "Breathes" | "Reps" | "Time";
export type MobilityType =
  | "Static"
  | "Dynamic"
  | "Branded"
  | "Corrective"
  | "PNF"
  | "Active";

export type MobilityMovement = {
  id: string;
  name: string;
  nameLower: string;
  type?: MobilityType;
  howTo?: string;
  defaultMetrics?: MobilityMetric[];
  createdAt: number;
  updatedAt: number;
};

interface MobilityMovementState {
  ready: boolean;
  movements: Dict<MobilityMovement>;
  byName: Dict<string>;
  ensureReady: () => void;
  ensureLocalMovement: (data: {
    name: string;
    type?: MobilityType;
    howTo?: string;
    defaultMetrics?: MobilityMetric[];
  }) => { id: string; created: boolean; movement: MobilityMovement };
}

export const useMobilityMovementLibrary = create<MobilityMovementState>()(
  persist(
    (set, get) => ({
      ready: false,
      movements: {},
      byName: {},

      ensureReady() {
        if (!get().ready) set({ ready: true });
      },

      ensureLocalMovement(data) {
        const name = data.name.trim();
        const key = name.toLowerCase();
        const { byName, movements } = get();
        const existingId = byName[key];
        if (existingId) {
          return { id: existingId, created: false, movement: movements[existingId] };
        }
        const now = Date.now();
        const id = `mob_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
        const created: MobilityMovement = {
          id,
          name,
          nameLower: key,
          type: data.type,
          howTo: data.howTo?.trim() || "",
          defaultMetrics: data.defaultMetrics ?? [],
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({
          movements: { ...s.movements, [created.id]: created },
          byName: { ...s.byName, [created.nameLower]: created.id },
          ready: true,
        }));
        return { id: created.id, created: true, movement: created };
      },
    }),
    {
      name: "myva_mobility_library_v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ movements: s.movements, byName: s.byName, ready: s.ready }),
      version: 1,
    }
  )
);
