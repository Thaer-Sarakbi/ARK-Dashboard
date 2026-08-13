import { create } from "zustand";
import { fetchAnalyticsForRange, type HotelAnalyticsTotals } from "@/lib/analyticsData";
import { getLastNDaysKeys } from "@/lib/utils";

export type AnalyticsRange = "1" | "7" | "30";

export const RANGE_LABELS: Record<AnalyticsRange, string> = {
  "1": "Last day",
  "7": "Last 7 days",
  "30": "Last 30 days",
};

const RANGE_DAYS: Record<AnalyticsRange, number> = { "1": 1, "7": 7, "30": 30 };

interface AnalyticsState {
  range: AnalyticsRange;
  items: HotelAnalyticsTotals[];
  loading: boolean;
  error: string | null;
  fetchForRange: (range: AnalyticsRange) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  range: "7",
  items: [],
  loading: false,
  error: null,

  fetchForRange: async (range: AnalyticsRange) => {
    set({ loading: true, error: null, range });
    try {
      const dateKeys = getLastNDaysKeys(RANGE_DAYS[range]);
      const items = await fetchAnalyticsForRange(dateKeys);
      set({ items, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false, items: [] });
    }
  },
}));
