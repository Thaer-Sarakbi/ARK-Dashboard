import { create } from "zustand";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SalesDoc } from "@/lib/types";
import { todayKey } from "@/lib/utils";

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

interface SalesState {
  items: SalesDoc[];
  loading: boolean;
  error: string | null;
  currentDate: string;
  fetchForDate: (dateKey: string) => Promise<void>;
}

export const useSalesStore = create<SalesState>((set) => ({
  items: [],
  loading: false,
  error: null,
  currentDate: todayKey(),

  fetchForDate: async (dateKey: string) => {
    set({ loading: true, error: null, currentDate: dateKey });
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const hotels = Array.from(
        new Set(
          usersSnap.docs
            .map((d) => (d.data().placeName ?? "") as string)
            .filter(Boolean)
        )
      ).sort();

      const results = await Promise.all(
        hotels.map(async (hotel) => {
          const snap = await getDoc(doc(db, "sales", dateKey, hotel, "today"));
          if (!snap.exists()) return null;
          const data = snap.data();
          return {
            hotel,
            before: toNumber(data.before),
            totalSales: toNumber(data.totalSales),
            totalExpenses: toNumber(data.totalExpenses),
            banking: toNumber(data.banking),
            after: toNumber(data.after),
          } satisfies SalesDoc;
        })
      );

      set({ items: results.filter((r): r is SalesDoc => r !== null), loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false, items: [] });
    }
  },
}));
