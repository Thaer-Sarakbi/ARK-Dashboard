"use client";

import { useEffect, useState } from "react";
import { IconUsers } from "@tabler/icons-react";
import { useWorkersStore } from "@/store/useWorkersStore";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getAttendanceStatus, formatTime, calcDuration } from "@/lib/utils";

export default function AttendancePage() {
  const { workers, loading, subscribe } = useWorkersStore();
  const [hotel, setHotel] = useState("all");

  useEffect(() => {
    const unsub = subscribe();
    return unsub;
  }, [subscribe]);

  const hotels = Array.from(new Set(workers.map((w) => w.placeName).filter(Boolean))).sort();

  const filtered = hotel === "all" ? workers : workers.filter((w) => w.placeName === hotel);

  return (
    <div className="flex flex-col gap-3">
      {/* Filter bar */}
      <div className="flex items-center gap-2.5">
        <label className="text-[11px] text-muted">Filter by hotel</label>
        <select
          value={hotel}
          onChange={(e) => setHotel(e.target.value)}
          className="text-[11px] px-2 py-1 rounded-md text-text outline-none"
          style={{ border: "0.5px solid rgba(0,0,0,0.10)", background: "rgba(0,0,0,0.04)" }}
        >
          <option value="all">All hotels</option>
          {hotels.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
        <div className="ml-auto text-[11px] text-muted">
          Showing {filtered.length} worker{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table card */}
      <div
        className="rounded-xl px-[15px] py-[13px]"
        style={{ background: "var(--color-surface)", border: "0.5px solid rgba(0,0,0,0.10)" }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-text">
            <IconUsers size={14} color="var(--color-acc)" />
            Attendance register
          </div>
          <button className="text-[11px] text-acc-txt">Export</button>
        </div>

        <table className="w-full text-[11px] border-collapse" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th className="text-left text-muted font-medium pb-1.5 w-[28%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Worker</th>
              <th className="text-left text-muted font-medium pb-1.5 w-[22%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Hotel</th>
              <th className="text-left text-muted font-medium pb-1.5 w-[16%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Status</th>
              <th className="text-left text-muted font-medium pb-1.5 w-[16%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Check-in</th>
              <th className="text-left text-muted font-medium pb-1.5 w-[18%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Duration</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="text-center text-muted py-6">Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center text-muted py-6">No workers found</td></tr>
            )}
            {filtered.map((w) => {
              const status = getAttendanceStatus(w.checkIn);
              const duration = w.checkIn ? calcDuration(w.checkIn, w.checkOut) : null;
              const pct = w.checkIn && w.checkOut
                ? Math.min(100, Math.round(((w.checkOut.toMillis() - w.checkIn.toMillis()) / (8 * 3600000)) * 100))
                : w.checkIn ? 50 : 0;

              return (
                <tr key={w.id}>
                  <td className="py-1.5" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                    <div className="flex items-center gap-1.5">
                      <Avatar userId={w.id} name={w.name} size={22} />
                      <span className="truncate">{w.name}</span>
                    </div>
                  </td>
                  <td className="py-1.5 text-muted" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>{w.placeName}</td>
                  <td className="py-1.5" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                    <StatusBadge status={status} />
                  </td>
                  <td className="py-1.5 text-muted" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                    {w.checkIn ? formatTime(w.checkIn) : "–"}
                  </td>
                  <td className="py-1.5" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                    {duration ? <ProgressBar value={pct} width={55} /> : <span className="text-muted">–</span>}
                    {duration && <span className="text-[10px] text-muted ml-1">{duration}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
