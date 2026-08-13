"use client";

import { useEffect } from "react";
import { IconBed, IconCash, IconChartBar, IconChartLine, IconReceipt2, IconWorld } from "@tabler/icons-react";
import { useAnalyticsStore, RANGE_LABELS, type AnalyticsRange } from "@/store/useAnalyticsStore";
import { useHotelTrendStore } from "@/store/useHotelTrendStore";
import { HotelBarChart } from "@/components/analytics/HotelBarChart";
import { HotelTrendChart } from "@/components/analytics/HotelTrendChart";
import { SORTED_HOTELS } from "@/lib/analyticsData";

function formatAmount(n: number): string {
  return `${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RM`;
}

function formatCount(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

const RANGES: AnalyticsRange[] = ["1", "7", "30"];

export default function AnalyticsPage() {
  const { items, loading, range, fetchForRange } = useAnalyticsStore();
  const { items: trendItems, loading: trendLoading, hotel, range: trendRange, fetch: fetchTrend } = useHotelTrendStore();

  useEffect(() => {
    fetchForRange(range);
    fetchTrend(hotel, trendRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-text">
          <IconChartBar size={15} color="var(--color-acc)" />
          Analytics · by hotel
        </div>

        <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: "var(--color-canvas)" }}>
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => fetchForRange(r)}
              className="px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors"
              style={{
                background: range === r ? "var(--color-surface)" : "transparent",
                color: range === r ? "var(--color-acc-txt)" : "var(--color-muted)",
                boxShadow: range === r ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div
          className="rounded-xl px-[15px] py-[13px] text-center text-[12px] text-muted"
          style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-border)" }}
        >
          Loading…
        </div>
      )}

      {!loading && items.length === 0 && (
        <div
          className="rounded-xl px-[15px] py-[13px] text-center text-[12px] text-muted"
          style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-border)" }}
        >
          No sales data for this period
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          <HotelBarChart
            title="Total Sales"
            icon={<IconCash size={15} color="var(--color-acc)" />}
            data={items.map((h) => ({ hotel: h.hotel, value: h.totalSales }))}
            formatValue={formatAmount}
          />
          <HotelBarChart
            title="Total Expenses"
            icon={<IconReceipt2 size={15} color="var(--color-acc)" />}
            data={items.map((h) => ({ hotel: h.hotel, value: h.totalExpenses }))}
            formatValue={formatAmount}
          />
          <HotelBarChart
            title="Empty Rooms"
            icon={<IconBed size={15} color="var(--color-acc)" />}
            data={items.map((h) => ({ hotel: h.hotel, value: h.emptyRooms }))}
            formatValue={formatCount}
          />
          <HotelBarChart
            title="Online Booking"
            icon={<IconWorld size={15} color="var(--color-acc)" />}
            data={items.map((h) => ({ hotel: h.hotel, value: h.onlineBooking }))}
            formatValue={formatCount}
          />
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-text">
          <IconChartLine size={15} color="var(--color-acc)" />
          Hotel trend
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={hotel}
            onChange={(e) => fetchTrend(e.target.value, trendRange)}
            className="text-[12px] px-2 py-1 rounded-md text-text outline-none"
            style={{ border: "0.5px solid rgba(0,0,0,0.10)", background: "rgba(0,0,0,0.04)" }}
          >
            {SORTED_HOTELS.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: "var(--color-canvas)" }}>
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => fetchTrend(hotel, r)}
                className="px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors"
                style={{
                  background: trendRange === r ? "var(--color-surface)" : "transparent",
                  color: trendRange === r ? "var(--color-acc-txt)" : "var(--color-muted)",
                  boxShadow: trendRange === r ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className="rounded-xl px-[15px] py-[13px]"
        style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-border)" }}
      >
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-text mb-3">
          {hotel}
        </div>

        {trendLoading ? (
          <div className="text-center text-[12px] text-muted py-10">Loading…</div>
        ) : (
          <HotelTrendChart data={trendItems} />
        )}
      </div>
    </div>
  );
}
