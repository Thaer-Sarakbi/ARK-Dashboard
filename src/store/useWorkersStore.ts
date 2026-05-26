import { create } from "zustand";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { WorkerWithAttendance } from "@/lib/types";
import { todayKey } from "@/lib/utils";

interface WorkersState {
  workers: WorkerWithAttendance[];
  loading: boolean;
  error: string | null;
  subscribe: () => () => void;
  clear: () => void;
}

export const useWorkersStore = create<WorkersState>((set) => ({
  workers: [],
  loading: false,
  error: null,

  subscribe: () => {
    set({ loading: true, error: null });
    const today = todayKey();

    const unsubscribe = onSnapshot(
      collection(db, "users"),
      async (snapshot) => {
        const baseDocs = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...(data as Omit<WorkerWithAttendance, "id" | "name" | "checkIn" | "checkOut">),
            name: (data.fullName ?? data.name ?? "") as string,
          };
        });

        const attendanceResults = await Promise.all(
          baseDocs.map(async (worker) => {
            const [checkInSnap, checkOutSnap, nightInSnap, nightOutSnap] = await Promise.all([
              getDoc(doc(db, "users", worker.id, "attendance", today, "checkIn", "Morning")),
              getDoc(doc(db, "users", worker.id, "attendance", today, "checkOut", "Morning")),
              getDoc(doc(db, "users", worker.id, "attendance", today, "checkIn", "Night")),
              getDoc(doc(db, "users", worker.id, "attendance", today, "checkOut", "Night")),
            ]);

            const checkIn = checkInSnap.exists() ? (checkInSnap.data().time as Timestamp) : null;
            const checkOut = checkOutSnap.exists() ? ((checkOutSnap.data().timestamp ?? checkOutSnap.data().time) as Timestamp) : null;
            const nightCheckIn = nightInSnap.exists() ? (nightInSnap.data().time as Timestamp) : null;
            const nightCheckOut = nightOutSnap.exists() ? ((nightOutSnap.data().timestamp ?? nightOutSnap.data().time) as Timestamp) : null;

            return { ...worker, checkIn, checkOut, nightCheckIn, nightCheckOut } as WorkerWithAttendance;
          })
        );

        set({ workers: attendanceResults, loading: false });
      },
      (err) => {
        set({ error: err.message, loading: false });
      }
    );

    return unsubscribe;
  },

  clear: () => set({ workers: [], loading: false, error: null }),
}));
