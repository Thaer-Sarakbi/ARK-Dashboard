import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  sub?: ReactNode;
  valueClass?: string;
}

export function KpiCard({ label, value, icon, sub, valueClass }: KpiCardProps) {
  return (
    <div
      className="rounded-xl px-[13px] py-[11px]"
      style={{ background: "var(--color-surface)", border: "0.5px solid rgba(0,0,0,0.10)" }}
    >
      <div className="flex items-center gap-1 text-[11px] text-muted mb-[3px]">
        {icon}
        {label}
      </div>
      <div className={`text-[21px] font-medium leading-none ${valueClass ?? "text-text"}`}>
        {value}
      </div>
      {sub && <div className="text-[10px] mt-[3px]">{sub}</div>}
    </div>
  );
}
