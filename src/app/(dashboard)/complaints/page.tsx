"use client";

import { useEffect, useState } from "react";
import { IconMessageReport, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useComplaintsStore } from "@/store/useComplaintsStore";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { todayKey, getPrevDay, getNextDay, formatDateKey } from "@/lib/utils";
import type { ComplaintSeverity } from "@/lib/types";

const SEVERITY_BAR: Record<ComplaintSeverity, string> = {
  high: "var(--color-err)",
  medium: "var(--color-warn)",
  low: "var(--color-ok)",
};

const SEVERITY_RANK: Record<ComplaintSeverity, number> = { high: 0, medium: 1, low: 2 };

export default function ComplaintsPage() {
  const { items, loading, fetchForDate } = useComplaintsStore();
  const [selectedDate, setSelectedDate] = useState(todayKey());

  const isToday = selectedDate === todayKey();

  useEffect(() => {
    fetchForDate(selectedDate);
  }, [selectedDate, fetchForDate]);

  const sorted = [...items].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Header row with count and date nav */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="text-[13px] font-medium text-text">Open complaints</div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-err-bg text-err">
            {sorted.length} open
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedDate((d) => getPrevDay(d))}
            className="p-0.5 rounded hover:bg-canvas transition-colors"
          >
            <IconChevronLeft size={15} color="var(--color-muted)" />
          </button>
          <span className="text-[12px] text-text font-medium min-w-[170px] text-center">
            {formatDateKey(selectedDate)}
          </span>
          <button
            onClick={() => { if (!isToday) setSelectedDate((d) => getNextDay(d)); }}
            disabled={isToday}
            className="p-0.5 rounded hover:bg-canvas transition-colors disabled:opacity-30"
          >
            <IconChevronRight size={15} color="var(--color-muted)" />
          </button>
        </div>
      </div>

      <div
        className="rounded-xl px-[15px] py-[13px]"
        style={{ background: "var(--color-surface)", border: "0.5px solid rgba(0,0,0,0.10)" }}
      >
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-text mb-2.5">
          <IconMessageReport size={15} color="var(--color-acc)" />
          All complaints · from admin reports
        </div>

        {loading && (
          <p className="text-[12px] text-muted text-center py-6">Loading…</p>
        )}
        {!loading && sorted.length === 0 && (
          <p className="text-[12px] text-muted text-center py-6">No complaints for this date</p>
        )}

        {sorted.map((c, i) => (
          <div
            key={c.id}
            className="flex gap-2 py-2"
            style={{ borderBottom: i < sorted.length - 1 ? "0.5px solid rgba(0,0,0,0.06)" : "none" }}
          >
            <div
              className="w-1 rounded flex-shrink-0 self-stretch"
              style={{ background: SEVERITY_BAR[c.severity] }}
            />
            <div className="flex-1">
              <div className="text-[12px] text-text">{c.text}</div>
              <div className="text-[11px] text-muted mt-0.5">
                {c.submittedBy} · {c.hotel}
              </div>
            </div>
            <StatusBadge status={c.severity} />
          </div>
        ))}
      </div>
    </div>
  );
}
