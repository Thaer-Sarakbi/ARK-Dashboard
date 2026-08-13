import { create } from "zustand";
import { fetchHotelTrendForRange, SORTED_HOTELS, type HotelTrendPoint } from "@/lib/analyticsData";
import { getLastNDaysKeys } from "@/lib/utils";
import type { AnalyticsRange } from "@/store/useAnalyticsStore";

const RANGE_DAYS: Record<AnalyticsRange, number> = { "1": 1, "7": 7, "30": 30 };

interface HotelTrendState {
  hotel: string;
  range: AnalyticsRange;
  items: HotelTrendPoint[];
  loading: boolean;
  error: string | null;
  fetch: (hotel: string, range: AnalyticsRange) => Promise<void>;
}

export const useHotelTrendStore = create<HotelTrendState>((set) => ({
  hotel: SORTED_HOTELS[0] ?? "",
  range: "7",
  items: [],
  loading: false,
  error: null,

  fetch: async (hotel: string, range: AnalyticsRange) => {
    set({ loading: true, error: null, hotel, range });
    try {
      const dateKeys = getLastNDaysKeys(RANGE_DAYS[range]);
      const items = await fetchHotelTrendForRange(hotel, dateKeys);
      set({ items, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false, items: [] });
    }
  },
}));
