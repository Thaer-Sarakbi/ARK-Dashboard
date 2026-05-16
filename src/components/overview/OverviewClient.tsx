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
import { useReportsStore } from "@/store/useReportsStore";
import { KpiCard } from "@/components/ui/KpiCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { AiChatPanel } from "./AiChatPanel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getAttendanceStatus, formatTime } from "@/lib/utils";

export function OverviewClient() {
  const { workers, subscribe: subWorkers } = useWorkersStore();
  const { subscribe: subTasks } = useTasksStore();
  const { subscribeReports, analysis, analysisLoading } = useReportsStore();

  useEffect(() => {
    const u1 = subWorkers();
    const u2 = subTasks();
    return () => { u1(); u2(); };
  }, [subWorkers, subTasks]);

  const adminIds = workers.filter((w) => w.admin).map((w) => w.id).sort().join(",");

  useEffect(() => {
    if (!adminIds) return;
    const admins = workers
      .filter((w) => w.admin)
      .map((w) => ({ id: w.id, name: w.name, placeName: w.placeName }));
    return subscribeReports(admins);
  }, [adminIds, subscribeReports]); // eslint-disable-line react-hooks/exhaustive-deps

  const presentCount = workers.filter((w) => getAttendanceStatus(w.checkIn) !== "Absent").length;
  const absentCount = workers.filter((w) => getAttendanceStatus(w.checkIn) === "Absent").length;
  const totalEmptyRooms = analysis?.hotels.reduce((s, h) => s + h.emptyRooms, 0) ?? 0;
  const openComplaints = analysis?.hotels.reduce((s, h) => s + h.complaints.length, 0) ?? 0;

  const recentWorkers = workers.slice(0, 4);

  return (
    <div className="flex flex-col gap-3">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <KpiCard
          label="Attendance (live)"
          value={presentCount}
          icon={<IconUsers size={12} color="var(--color-acc)" />}
          sub={<span className="text-ok">● Live · {workers.length > 0 ? Math.round((presentCount / workers.length) * 100) : 0}% rate</span>}
        />
        <KpiCard
          label="Absent today"
          value={absentCount}
          icon={<IconUserX size={12} color="var(--color-err)" />}
          valueClass="text-err"
          sub={<span className="text-err">Unexcused</span>}
        />
        <KpiCard
          label="Empty rooms"
          value={analysisLoading ? "…" : totalEmptyRooms}
          icon={<IconDoor size={12} color="var(--color-warn)" />}
          sub={<span className="text-warn">Across all hotels</span>}
        />
        <KpiCard
          label="Open complaints"
          value={analysisLoading ? "…" : openComplaints}
          icon={<IconMessageReport size={12} color="var(--color-err)" />}
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
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-text">
              <IconUsers size={14} color="var(--color-acc)" />
              Attendance · today (live)
            </div>
            <Link href="/attendance" className="text-[11px] text-acc-txt">All →</Link>
          </div>
          <table className="w-full text-[11px] border-collapse" style={{ tableLayout: "fixed" }}>
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
                const status = getAttendanceStatus(w.checkIn);
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
                      {w.checkIn ? formatTime(w.checkIn) : "–"}
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
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-text">
            <IconDoor size={14} color="var(--color-acc)" />
            Empty rooms today · by hotel
          </div>
          <Link href="/rooms" className="text-[11px] text-acc-txt">Full table →</Link>
        </div>
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr>
              <th className="text-left text-muted font-medium pb-1 w-[35%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Hotel name</th>
              <th className="text-left text-muted font-medium pb-1 w-[20%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Staff rooms</th>
              <th className="text-left text-muted font-medium pb-1 w-[20%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Empty rooms</th>
              <th className="text-left text-muted font-medium pb-1 w-[25%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Occupancy</th>
            </tr>
          </thead>
          <tbody>
            {analysisLoading && (
              <tr><td colSpan={4} className="text-center text-muted py-4">Analyzing reports…</td></tr>
            )}
            {!analysisLoading && analysis?.hotels.map((h) => {
              const total = h.staffRooms + h.occupiedRooms + h.emptyRooms;
              const pct = total > 0 ? Math.round((h.occupiedRooms / total) * 100) : 0;
              return (
                <tr key={h.hotelName}>
                  <td className="py-1.5 font-medium" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>{h.hotelName}</td>
                  <td className="py-1.5" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>{h.staffRooms}</td>
                  <td className="py-1.5 font-medium text-warn" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>{h.emptyRooms}</td>
                  <td className="py-1.5" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                    <ProgressBar value={pct} width={80} />
                  </td>
                </tr>
              );
            })}
            {!analysisLoading && !analysis && (
              <tr><td colSpan={4} className="text-center text-muted py-4">No reports available</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
