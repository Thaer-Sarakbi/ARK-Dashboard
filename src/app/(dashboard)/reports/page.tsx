"use client";

import { useEffect } from "react";
import { IconFileText } from "@tabler/icons-react";
import { useWorkersStore } from "@/store/useWorkersStore";
import { useReportsStore } from "@/store/useReportsStore";

export default function ReportsPage() {
  const { workers, subscribe } = useWorkersStore();
  const { reports, loading, subscribeReports } = useReportsStore();

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
      </div>

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
