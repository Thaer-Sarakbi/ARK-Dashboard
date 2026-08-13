"use client";

import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import type { HotelTrendPoint } from "@/lib/analyticsData";
import { formatDateKeyShort } from "@/lib/utils";

interface HotelTrendChartProps {
  data: HotelTrendPoint[];
}

// Fixed categorical order — never reassigned by filter state, so a line keeps
// its color no matter which hotel/range is selected.
type MetricKey = Exclude<keyof HotelTrendPoint, "date">;

const SERIES: {
  key: MetricKey;
  label: string;
  color: string;
  format: (n: number) => string;
}[] = [
  { key: "totalSales", label: "Total Sales", color: "#2a78d6", format: formatAmount },
  { key: "totalExpenses", label: "Total Expenses", color: "#eb6834", format: formatAmount },
  { key: "emptyRooms", label: "Empty Rooms", color: "#1baf7a", format: formatCount },
  { key: "onlineBooking", label: "Online Booking", color: "#eda100", format: formatCount },
];

function formatAmount(n: number): string {
  return `${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RM`;
}

function formatCount(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

const CHART_HEIGHT = 300;
const POINT_SLOT_PX = 44;

/** Each line is indexed to its own peak in the selected range (0-100%) so all
 *  4 series — money in the thousands next to single-digit room counts — stay
 *  visible on one shared axis. The tooltip always shows the real value. */
type ChartRow = { date: string } & Record<`${string}Pct`, number> & Record<string, number | string>;

function buildChartData(data: HotelTrendPoint[]): ChartRow[] {
  const maxByKey = new Map<string, number>();
  for (const s of SERIES) {
    maxByKey.set(s.key, Math.max(1, ...data.map((d) => d[s.key])));
  }
  return data.map((d) => {
    const row = { date: d.date } as ChartRow;
    for (const s of SERIES) {
      row[s.key] = d[s.key];
      row[`${s.key}Pct`] = (d[s.key] / (maxByKey.get(s.key) ?? 1)) * 100;
    }
    return row;
  });
}

function TrendTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0].payload as ChartRow;
  return (
    <div
      className="rounded-lg px-2.5 py-2 text-[12px]"
      style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-border)", boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}
    >
      <div className="text-muted mb-1.5">{formatDateKeyShort(String(label))}</div>
      <div className="flex flex-col gap-1">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className="inline-block rounded-full" style={{ width: 10, height: 2, background: s.color }} />
            <span className="font-medium text-text">{s.format(Number(row[s.key]) || 0)}</span>
            <span className="text-muted">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HotelTrendChart({ data }: HotelTrendChartProps) {
  const chartData = buildChartData(data);
  const width = Math.max(chartData.length * POINT_SLOT_PX, 480);

  if (data.length === 0) {
    return <div className="text-center text-[12px] text-muted py-10">No data for this hotel in this period</div>;
  }

  return (
    <div className="overflow-x-auto">
      <LineChart width={width} height={CHART_HEIGHT} data={chartData} margin={{ top: 8, right: 12, bottom: 8, left: 4 }}>
        <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.08)" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateKeyShort}
          tick={{ fontSize: 10, fill: "var(--color-muted)" }}
          tickLine={false}
          axisLine={{ stroke: "rgba(0,0,0,0.08)" }}
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fontSize: 10, fill: "var(--color-muted)" }}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip content={(props) => <TrendTooltip {...props} />} />
        <Legend
          formatter={(value) => <span style={{ color: "var(--color-text)", fontSize: 12 }}>{value}</span>}
          wrapperStyle={{ paddingTop: 8 }}
        />
        {SERIES.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={`${s.key}Pct`}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={{ r: 3, fill: s.color, stroke: "var(--color-surface)", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: s.color, stroke: "var(--color-surface)", strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    </div>
  );
}
