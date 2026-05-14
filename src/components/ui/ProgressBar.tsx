import { progressBarColor } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  width?: number | string;
  height?: number;
  colorClass?: string;
}

export function ProgressBar({
  value,
  width = 70,
  height = 4,
  colorClass,
}: ProgressBarProps) {
  const color = colorClass ?? progressBarColor(value);
  return (
    <div className="inline-flex items-center gap-1 align-middle">
      <div
        className="rounded"
        style={{
          width,
          height,
          background: "rgba(0,0,0,0.08)",
          display: "inline-block",
          verticalAlign: "middle",
        }}
      >
        <div
          className={`h-full rounded transition-all ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="text-[10px] text-muted whitespace-nowrap">{value}%</span>
    </div>
  );
}
