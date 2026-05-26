import { create } from "zustand";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { RoomStatusDoc } from "@/lib/types";
import { todayKey } from "@/lib/utils";

interface RoomStatusState {
  items: RoomStatusDoc[];
  loading: boolean;
  error: string | null;
  currentDate: string;
  fetchForDate: (dateKey: string) => Promise<void>;
}

export const useRoomStatusStore = create<RoomStatusState>((set) => ({
  items: [],
  loading: false,
  error: null,
  currentDate: todayKey(),

  fetchForDate: async (dateKey: string) => {
    set({ loading: true, error: null, currentDate: dateKey });
    try {
      const snap = await getDocs(collection(db, "dates", dateKey, "roomStatus"));
      const items: RoomStatusDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<RoomStatusDoc, "id">),
      }));
      set({ items, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false, items: [] });
    }
  },
}));
