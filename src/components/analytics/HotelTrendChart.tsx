"use client";

import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import type { HotelTrendPoint } from "@/lib/analyticsData";
import { formatDateKeyShort } from "@/lib/utils";

export type TrendMetric = Exclude<keyof HotelTrendPoint, "date">;

// Fixed color per metric — never reassigned by filter state, so a metric keeps
// its color no matter which hotel/range is selected.
export const TREND_METRICS: {
  key: TrendMetric;
  label: string;
  color: string;
  format: (n: number) => string;
}[] = [
  { key: "totalSales", label: "Total Sales", color: "#2a78d6", format: formatAmount },
  { key: "totalExpenses", label: "Total Expenses", color: "#eb6834", format: formatAmount },
  { key: "emptyRooms", label: "Empty Rooms", color: "#1baf7a", format: formatCount },
  { key: "onlineBooking", label: "Online Booking", color: "#eda100", format: formatCount },
];

interface HotelTrendChartProps {
  data: HotelTrendPoint[];
  metric: TrendMetric;
}

function formatAmount(n: number): string {
  return `${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RM`;
}

function formatCount(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function formatCompact(n: number): string {
  return n.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 });
}

const CHART_HEIGHT = 300;
const POINT_SLOT_PX = 44;

export function HotelTrendChart({ data, metric }: HotelTrendChartProps) {
  const series = TREND_METRICS.find((m) => m.key === metric) ?? TREND_METRICS[0];
  const width = Math.max(data.length * POINT_SLOT_PX, 480);

  if (data.length === 0) {
    return <div className="text-center text-[12px] text-muted py-10">No data for this hotel in this period</div>;
  }

  function TrendTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
    if (!active || !payload || !payload.length) return null;
    return (
      <div
        className="rounded-lg px-2.5 py-2 text-[12px]"
        style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-border)", boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}
      >
        <div className="text-muted mb-1">{formatDateKeyShort(String(label))}</div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block rounded-full" style={{ width: 10, height: 2, background: series.color }} />
          <span className="font-medium text-text">{series.format(Number(payload[0].value) || 0)}</span>
          <span className="text-muted">{series.label}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <LineChart width={width} height={CHART_HEIGHT} data={data} margin={{ top: 8, right: 12, bottom: 8, left: 4 }}>
        <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.08)" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateKeyShort}
          tick={{ fontSize: 10, fill: "var(--color-muted)" }}
          tickLine={false}
          axisLine={{ stroke: "rgba(0,0,0,0.08)" }}
        />
        <YAxis
          allowDecimals={false}
          tickFormatter={formatCompact}
          tick={{ fontSize: 10, fill: "var(--color-muted)" }}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <Tooltip content={(props) => <TrendTooltip {...props} />} />
        <Line
          type="monotone"
          dataKey={series.key}
          name={series.label}
          stroke={series.color}
          strokeWidth={2}
          dot={{ r: 3, fill: series.color, stroke: "var(--color-surface)", strokeWidth: 2 }}
          activeDot={{ r: 5, fill: series.color, stroke: "var(--color-surface)", strokeWidth: 2 }}
        />
      </LineChart>
    </div>
  );
}
