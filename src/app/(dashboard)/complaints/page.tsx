"use client";

import { useEffect } from "react";
import { IconMessageReport } from "@tabler/icons-react";
import { useWorkersStore } from "@/store/useWorkersStore";
import { useReportsStore } from "@/store/useReportsStore";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ComplaintSeverity } from "@/lib/types";

const SEVERITY_BAR: Record<ComplaintSeverity, string> = {
  high: "var(--color-err)",
  medium: "var(--color-warn)",
  low: "var(--color-ok)",
};

const SEVERITY_RANK: Record<ComplaintSeverity, number> = { high: 0, medium: 1, low: 2 };

export default function ComplaintsPage() {
  const { workers, subscribe } = useWorkersStore();
  const { analysis, analysisLoading, subscribeReports, reports } = useReportsStore();

  useEffect(() => {
    const unsub = subscribe();
    return unsub;
  }, [subscribe]);

  const adminIds = workers.filter((w) => w.admin).map((w) => w.id).sort().join(",");

  useEffect(() => {
    if (!adminIds) return;
    const admins = workers
      .filter((w) => w.admin)
      .map((w) => ({ id: w.id, name: w.name, placeName: w.placeName }));
    return subscribeReports(admins);
  }, [adminIds, subscribeReports]); // eslint-disable-line react-hooks/exhaustive-deps

  const complaints = (
    analysis?.hotels.flatMap((h) =>
      h.complaints.map((c) => ({
        ...c,
        hotelName: h.hotelName,
        submitterName: reports.find((r) => r.hotelName === h.hotelName)?.workerName ?? "Admin",
        date: reports.find((r) => r.hotelName === h.hotelName)?.date ?? "",
      }))
    ) ?? []
  ).sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

  const open = complaints.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className="text-[12px] font-medium text-text">Open complaints</div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-err-bg text-err">
          {open} open
        </span>
      </div>

      <div
        className="rounded-xl px-[15px] py-[13px]"
        style={{ background: "var(--color-surface)", border: "0.5px solid rgba(0,0,0,0.10)" }}
      >
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-text mb-2.5">
          <IconMessageReport size={14} color="var(--color-acc)" />
          All complaints · from admin reports
        </div>

        {analysisLoading && (
          <p className="text-[11px] text-muted text-center py-6">Analyzing reports…</p>
        )}
        {!analysisLoading && complaints.length === 0 && (
          <p className="text-[11px] text-muted text-center py-6">No complaints reported</p>
        )}

        {complaints.map((c, i) => (
          <div
            key={i}
            className="flex gap-2 py-1.5"
            style={{ borderBottom: i < complaints.length - 1 ? "0.5px solid rgba(0,0,0,0.06)" : "none" }}
          >
            <div
              className="w-1 rounded flex-shrink-0 self-stretch"
              style={{ background: SEVERITY_BAR[c.severity] }}
            />
            <div className="flex-1">
              <div className="text-[11px] text-text">{c.text}</div>
              <div className="text-[10px] text-muted mt-0.5">
                {c.submitterName} · {c.hotelName} · {c.date}
              </div>
            </div>
            <StatusBadge status={c.severity} />
          </div>
        ))}
      </div>
    </div>
  );
}
