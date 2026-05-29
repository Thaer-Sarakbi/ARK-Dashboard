"use client";

import { useEffect } from "react";
import { IconFileText, IconRefresh, IconCheck, IconAlertCircle } from "@tabler/icons-react";
import { useWorkersStore } from "@/store/useWorkersStore";
import { useReportsStore } from "@/store/useReportsStore";

export default function ReportsPage() {
  const { workers, subscribe } = useWorkersStore();
  const { reports, analysis, analysisLoading, saveStatus, loading, subscribeReports, fetchAnalysis } = useReportsStore();

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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className="text-[12px] font-medium text-text flex items-center gap-1.5">
          <IconFileText size={14} color="var(--color-acc)" />
          Daily reports · admin submissions
        </div>
        <button
          onClick={fetchAnalysis}
          disabled={analysisLoading || saveStatus === "saving" || reports.length === 0}
          className="ml-auto flex items-center gap-1 text-[11px] disabled:opacity-50"
          style={{
            color: saveStatus === "saved" ? "var(--color-ok)" : saveStatus === "error" ? "var(--color-err)" : "var(--color-acc)",
          }}
        >
          {saveStatus === "saved" ? (
            <><IconCheck size={12} />Saved</>
          ) : saveStatus === "error" ? (
            <><IconAlertCircle size={12} />Failed</>
          ) : (
            <><IconRefresh size={12} className={analysisLoading || saveStatus === "saving" ? "animate-spin" : ""} />
            {analysisLoading ? "Analyzing…" : saveStatus === "saving" ? "Saving…" : "Analyze & Save"}</>
          )}
        </button>
      </div>

      {loading && <p className="text-[11px] text-muted text-center py-6">Loading reports…</p>}
      {!loading && reports.length === 0 && (
        <p className="text-[11px] text-muted text-center py-6">No admin reports found for today or yesterday</p>
      )}

      {Object.entries(byHotel).map(([hotel, hotelReports]) => {
        const hotelAnalysis = analysis?.hotels.find((h) => h.hotelName === hotel);

        return (
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

            {hotelAnalysis && (
              <div
                className="mt-3 px-3 py-2.5 rounded-lg text-[11px]"
                style={{ background: "var(--color-acc-bg)", border: "0.5px solid rgba(24,95,165,0.2)" }}
              >
                <div className="font-medium text-acc-txt mb-1">AI Analysis</div>
                <div className="text-acc-txt space-y-0.5">
                  <div>Empty rooms: {hotelAnalysis.emptyRooms} · Staff rooms: {hotelAnalysis.staffRooms} · Occupied: {hotelAnalysis.occupiedRooms}</div>
                  {hotelAnalysis.complaints.length > 0 && (
                    <div>Complaints ({hotelAnalysis.complaints.length}): {hotelAnalysis.complaints.map((c) => c.text).join("; ")}</div>
                  )}
                  {hotelAnalysis.complaints.length === 0 && <div>No complaints reported</div>}
                </div>
              </div>
            )}

            {analysisLoading && !hotelAnalysis && (
              <div className="text-[10px] text-muted mt-2">Analyzing…</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
