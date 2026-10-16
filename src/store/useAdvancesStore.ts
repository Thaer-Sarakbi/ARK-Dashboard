import { create } from "zustand";
import { collectionGroup, onSnapshot, type Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SalaryAdvance } from "@/lib/types";

interface AdvancesState {
  advances: SalaryAdvance[];
  loading: boolean;
  error: string | null;
  subscribe: () => () => void;
  clear: () => void;
}

export function advanceCreatedMs(a: Pick<SalaryAdvance, "creationDate">): number {
  const d = a.creationDate;
  if (!d) return 0;
  if (d instanceof Date) return d.getTime();
  if ((d as Timestamp).toMillis) return (d as Timestamp).toMillis();
  return 0;
}

export const useAdvancesStore = create<AdvancesState>((set) => ({
  advances: [],
  loading: false,
  error: null,

  // Listens to every users/{uid}/advances/{advanceId} doc across all users
  subscribe: () => {
    set({ loading: true, error: null });

    const unsubscribe = onSnapshot(
      collectionGroup(db, "advances"),
      (snapshot) => {
        const advances = snapshot.docs
          .filter((d) => d.ref.path.startsWith("users/"))
          .map((d) => ({
            id: d.id,
            userId: d.ref.path.split("/")[1],
            ...(d.data() as Omit<SalaryAdvance, "id" | "userId">),
          }))
          .sort((a, b) => advanceCreatedMs(b) - advanceCreatedMs(a));

        set({ advances, loading: false });
      },
      (err) => {
        set({ error: err.message, loading: false });
      }
    );

    return unsubscribe;
  },

  clear: () => set({ advances: [], loading: false, error: null }),
}));
