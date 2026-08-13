"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

export interface HotelChartDatum {
  hotel: string;
  value: number;
}

interface HotelBarChartProps {
  title: string;
  icon: React.ReactNode;
  data: HotelChartDatum[];
  formatValue: (n: number) => string;
}

const BAR_SLOT_PX = 52;
const CHART_HEIGHT = 280;

function formatTick(v: number): string {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
  return `${v}`;
}

function ChartTooltip({ active, payload, formatValue }: TooltipContentProps<ValueType, NameType> & { formatValue: (n: number) => string }) {
  if (!active || !payload || !payload.length) return null;
  const datum = payload[0].payload as HotelChartDatum;
  return (
    <div
      className="rounded-lg px-2.5 py-2 text-[12px]"
      style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-border)", boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}
    >
      <div className="font-medium text-text">{formatValue(datum.value)}</div>
      <div className="text-muted mt-0.5">{datum.hotel}</div>
    </div>
  );
}

export function HotelBarChart({ title, icon, data, formatValue }: HotelBarChartProps) {
  const width = Math.max(data.length * BAR_SLOT_PX, 320);

  return (
    <div
      className="rounded-xl px-[15px] py-[13px]"
      style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-border)" }}
    >
      <div className="flex items-center gap-1.5 text-[13px] font-medium text-text mb-3">
        {icon}
        {title}
      </div>

      {data.length === 0 ? (
        <div className="text-center text-[12px] text-muted py-10">No data for this period</div>
      ) : (
        <div className="overflow-x-auto">
          <BarChart
            width={width}
            height={CHART_HEIGHT}
            data={data}
            margin={{ top: 8, right: 8, bottom: 48, left: 4 }}
            barCategoryGap={8}
          >
            <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.08)" />
            <XAxis
              dataKey="hotel"
              tick={{ fontSize: 10, fill: "var(--color-muted)" }}
              angle={-40}
              textAnchor="end"
              interval={0}
              tickLine={false}
              axisLine={{ stroke: "rgba(0,0,0,0.08)" }}
              height={70}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--color-muted)" }}
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={formatTick}
            />
            <Tooltip
              cursor={{ fill: "rgba(24,95,165,0.06)" }}
              content={(props) => <ChartTooltip {...props} formatValue={formatValue} />}
            />
            <Bar dataKey="value" fill="var(--color-acc)" radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </div>
      )}
    </div>
  );
}
