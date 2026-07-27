import { create } from "zustand";
import type { SalesDoc } from "@/lib/types";
import { todayKey } from "@/lib/utils";
import { fetchHotelList, fetchSalesForDate } from "@/lib/salesData";

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
      const hotels = await fetchHotelList();
      const items = await fetchSalesForDate(dateKey, hotels);
      set({ items, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false, items: [] });
    }
  },
}));
