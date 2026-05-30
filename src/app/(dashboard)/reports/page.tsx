"use client";

import { useEffect } from "react";
import { IconFileText, IconSparkles, IconCheck, IconAlertCircle } from "@tabler/icons-react";
import { useWorkersStore } from "@/store/useWorkersStore";
import { useReportsStore } from "@/store/useReportsStore";

export default function ReportsPage() {
  const { workers, subscribe } = useWorkersStore();
  const { reports, loading, subscribeReports, fetchAnalysis, analysisLoading, saveStatus, error } =
    useReportsStore();

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

  const byHotel = reports.reduce<Record<string, typeof reports>>((acc, r) => {
    if (!acc[r.hotelName]) acc[r.hotelName] = [];
    acc[r.hotelName].push(r);
    return acc;
  }, {});

  const hasReports = reports.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2.5">
        <div className="text-[12px] font-medium text-text flex items-center gap-1.5">
          <IconFileText size={14} color="var(--color-acc)" />
          Daily reports · admin submissions
        </div>

        <button
          onClick={fetchAnalysis}
          disabled={!hasReports || analysisLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "var(--color-acc)", color: "#fff" }}
        >
          {analysisLoading ? (
            <>
              <span
                className="inline-block w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin"
              />
              Analyzing…
            </>
          ) : saveStatus === "saved" ? (
            <>
              <IconCheck size={12} />
              Saved
            </>
          ) : saveStatus === "error" ? (
            <>
              <IconAlertCircle size={12} />
              Failed
            </>
          ) : (
            <>
              <IconSparkles size={12} />
              Analyze Reports
            </>
          )}
        </button>
      </div>

      {error && saveStatus === "error" && (
        <div
          className="text-[11px] px-3 py-2 rounded-lg"
          style={{ background: "var(--color-err-bg)", color: "var(--color-err)" }}
        >
          {error}
        </div>
      )}

      {loading && <p className="text-[11px] text-muted text-center py-6">Loading reports…</p>}
      {!loading && reports.length === 0 && (
        <p className="text-[11px] text-muted text-center py-6">No admin reports found for today or yesterday</p>
      )}

      {Object.entries(byHotel).map(([hotel, hotelReports]) => (
        <div
          key={hotel}
          className="rounded-xl px-[15px] py-[13px]"
          style={{ background: "var(--color-surface)", border: "0.5px solid rgba(0,0,0,0.10)" }}
        >
          <div className="text-[12px] font-medium text-text mb-3">{hotel}</div>

          {hotelReports.map((r) => (
            <div key={r.userId} className="mb-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[11px] font-medium text-text">{r.workerName}</span>
                <span className="text-[10px] text-muted">· {r.date}</span>
              </div>
              <div
                className="text-[11px] text-muted leading-relaxed px-3 py-2.5 rounded-lg"
                style={{ background: "rgba(0,0,0,0.04)", border: "0.5px solid rgba(0,0,0,0.08)" }}
              >
                {r.note}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
