"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  IconUsers,
  IconUserX,
  IconDoor,
  IconMessageReport,
} from "@tabler/icons-react";
import { useWorkersStore } from "@/store/useWorkersStore";
import { useTasksStore } from "@/store/useTasksStore";
import { useRoomStatusStore } from "@/store/useRoomStatusStore";
import { useComplaintsStore } from "@/store/useComplaintsStore";
import { KpiCard } from "@/components/ui/KpiCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { AiChatPanel } from "./AiChatPanel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getAttendanceStatus, formatTime, todayKey } from "@/lib/utils";

export function OverviewClient() {
  const { workers, subscribe: subWorkers } = useWorkersStore();
  const { subscribe: subTasks } = useTasksStore();
  const { items: roomItems, loading: roomsLoading, fetchForDate: fetchRooms } = useRoomStatusStore();
  const { items: complaintItems, loading: complaintsLoading, fetchForDate: fetchComplaints } = useComplaintsStore();

  useEffect(() => {
    const u1 = subWorkers();
    const u2 = subTasks();
    return () => { u1(); u2(); };
  }, [subWorkers, subTasks]);

  useEffect(() => {
    const today = todayKey();
    fetchRooms(today);
    fetchComplaints(today);
  }, [fetchRooms, fetchComplaints]);

  const presentCount = workers.filter((w) => getAttendanceStatus(w.checkIn, w.nightCheckIn) !== "Absent").length;
  const absentCount = workers.filter((w) => getAttendanceStatus(w.checkIn, w.nightCheckIn) === "Absent").length;
  const totalEmptyRooms = roomItems.reduce((s, h) => s + (h.emptyRooms ?? 0), 0);
  const openComplaints = complaintItems.length;

  const recentWorkers = workers.slice(0, 4);

  return (
    <div className="flex flex-col gap-3">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <KpiCard
          label="Attendance (live)"
          value={presentCount}
          icon={<IconUsers size={13} color="var(--color-acc)" />}
          sub={<span className="text-ok">● Live · {workers.length > 0 ? Math.round((presentCount / workers.length) * 100) : 0}% rate</span>}
        />
        <KpiCard
          label="Absent today"
          value={absentCount}
          icon={<IconUserX size={13} color="var(--color-err)" />}
          valueClass="text-err"
          sub={<span className="text-err">Unexcused</span>}
        />
        <KpiCard
          label="Empty rooms"
          value={roomsLoading ? "…" : totalEmptyRooms}
          icon={<IconDoor size={13} color="var(--color-warn)" />}
          sub={<span className="text-warn">Across all hotels</span>}
        />
        <KpiCard
          label="Open complaints"
          value={complaintsLoading ? "…" : openComplaints}
          icon={<IconMessageReport size={13} color="var(--color-err)" />}
          valueClass="text-err"
          sub={
            <Link href="/complaints" className="text-acc-txt underline-offset-2">
              View list →
            </Link>
          }
        />
      </div>

      {/* Middle row: attendance table + AI panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Attendance card */}
        <div
          className="rounded-xl px-[15px] py-[13px]"
          style={{ background: "var(--color-surface)", border: "0.5px solid rgba(0,0,0,0.10)" }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-[13px] font-medium text-text">
              <IconUsers size={15} color="var(--color-acc)" />
              Attendance · today (live)
            </div>
            <Link href="/attendance" className="text-[12px] text-acc-txt">All →</Link>
          </div>
          <table className="w-full text-[12px] border-collapse" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th className="text-left text-muted font-medium pb-1 w-[36%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Worker</th>
                <th className="text-left text-muted font-medium pb-1 w-[28%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Hotel</th>
                <th className="text-left text-muted font-medium pb-1 w-[20%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Status</th>
                <th className="text-left text-muted font-medium pb-1 w-[16%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>In</th>
              </tr>
            </thead>
            <tbody>
              {recentWorkers.map((w) => {
                const status = getAttendanceStatus(w.checkIn, w.nightCheckIn);
                return (
                  <tr key={w.id}>
                    <td className="py-1.5" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                      <div className="flex items-center gap-1.5">
                        <Avatar userId={w.id} name={w.name} size={22} />
                        <span className="truncate">{w.name}</span>
                      </div>
                    </td>
                    <td className="py-1.5 text-muted truncate" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>{w.placeName}</td>
                    <td className="py-1.5" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                      <StatusBadge status={status} />
                    </td>
                    <td className="py-1.5 text-muted" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                      {w.checkIn ? formatTime(w.checkIn) : (w.nightCheckIn ? formatTime(w.nightCheckIn) : "–")}
                    </td>
                  </tr>
                );
              })}
              {recentWorkers.length === 0 && (
                <tr><td colSpan={4} className="text-center text-muted py-4">Loading…</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* AI panel */}
        <AiChatPanel />
      </div>

      {/* Rooms table */}
      <div
        className="rounded-xl px-[15px] py-[13px]"
        style={{ background: "var(--color-surface)", border: "0.5px solid rgba(0,0,0,0.10)" }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-text">
            <IconDoor size={15} color="var(--color-acc)" />
            Empty rooms today · by hotel
          </div>
          <Link href="/rooms" className="text-[12px] text-acc-txt">Full table →</Link>
        </div>
        <table className="w-full text-[12px] border-collapse">
          <thead>
            <tr>
              <th className="text-left text-muted font-medium pb-1 w-[35%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Hotel name</th>
              <th className="text-left text-muted font-medium pb-1 w-[20%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Staff rooms</th>
              <th className="text-left text-muted font-medium pb-1 w-[20%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Empty rooms</th>
              <th className="text-left text-muted font-medium pb-1 w-[25%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Occupancy</th>
            </tr>
          </thead>
          <tbody>
            {roomsLoading && (
              <tr><td colSpan={4} className="text-center text-muted py-4">Loading…</td></tr>
            )}
            {!roomsLoading && roomItems.map((h) => {
              const total = (h.staffRooms ?? 0) + (h.occupiedRooms ?? 0) + (h.emptyRooms ?? 0);
              const pct = total > 0 ? Math.round(((h.occupiedRooms ?? 0) / total) * 100) : 0;
              return (
                <tr key={h.id}>
                  <td className="py-1.5 font-medium" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>{h.hotel}</td>
                  <td className="py-1.5" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>{h.staffRooms ?? 0}</td>
                  <td className="py-1.5 font-medium text-warn" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>{h.emptyRooms ?? 0}</td>
                  <td className="py-1.5" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                    <ProgressBar value={pct} width={80} />
                  </td>
                </tr>
              );
            })}
            {!roomsLoading && roomItems.length === 0 && (
              <tr><td colSpan={4} className="text-center text-muted py-4">No room data available — run AI analysis first</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
