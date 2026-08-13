import { fetchSalesForDate } from "@/lib/salesData";
import { Hotels } from "@/lib/utils";

export interface HotelAnalyticsTotals {
  hotel: string;
  totalSales: number;
  totalExpenses: number;
  emptyRooms: number;
  onlineBooking: number;
}

const UNIQUE_HOTELS = Array.from(new Set(Hotels));

export const SORTED_HOTELS = [...UNIQUE_HOTELS].sort((a, b) => a.localeCompare(b));

/**
 * Sums totalSales / totalExpenses / emptyRooms / onlineBooking per hotel across
 * every date in `dateKeys`. A hotel with no doc on a given date contributes 0 for
 * that day. Hotels with no doc on ANY date in the range are omitted entirely
 * (same "only show hotels that submitted" behavior as the daily sales page).
 */
export async function fetchAnalyticsForRange(dateKeys: string[]): Promise<HotelAnalyticsTotals[]> {
  const perDate = await Promise.all(dateKeys.map((dateKey) => fetchSalesForDate(dateKey, UNIQUE_HOTELS)));

  const totals = new Map<string, HotelAnalyticsTotals>();
  for (const items of perDate) {
    for (const h of items) {
      const t = totals.get(h.hotel) ?? { hotel: h.hotel, totalSales: 0, totalExpenses: 0, emptyRooms: 0, onlineBooking: 0 };
      t.totalSales += h.totalSales;
      t.totalExpenses += h.totalExpenses;
      t.emptyRooms += h.emptyRooms;
      t.onlineBooking += h.onlineBooking;
      totals.set(h.hotel, t);
    }
  }

  return Array.from(totals.values()).sort((a, b) => a.hotel.localeCompare(b.hotel));
}

export interface HotelTrendPoint {
  date: string; // DD-MM-YYYY
  totalSales: number;
  totalExpenses: number;
  emptyRooms: number;
  onlineBooking: number;
}

/**
 * Per-day series for a single hotel across `dateKeys`, in the same order as
 * `dateKeys`. A date with no doc for the hotel contributes a 0 point rather
 * than being skipped, so the line stays continuous across gaps.
 */
export async function fetchHotelTrendForRange(hotel: string, dateKeys: string[]): Promise<HotelTrendPoint[]> {
  return Promise.all(
    dateKeys.map(async (date) => {
      const [doc] = await fetchSalesForDate(date, [hotel]);
      return {
        date,
        totalSales: doc?.totalSales ?? 0,
        totalExpenses: doc?.totalExpenses ?? 0,
        emptyRooms: doc?.emptyRooms ?? 0,
        onlineBooking: doc?.onlineBooking ?? 0,
      };
    })
  );
}
