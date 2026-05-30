"use client";

import { useEffect, useState, useCallback } from "react";
import { IconUsers, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { collection, doc, getDoc, getDocs, type Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useWorkersStore } from "@/store/useWorkersStore";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { WorkerAttendanceModal } from "@/components/attendance/WorkerAttendanceModal";
import {
  getAttendanceStatus,
  formatTime,
  calcDuration,
  todayKey,
  getPrevDay,
  getNextDay,
  formatDateKey,
} from "@/lib/utils";
import type { WorkerWithAttendance } from "@/lib/types";

async function fetchAttendanceForDate(dateKey: string): Promise<WorkerWithAttendance[]> {
  const usersSnap = await getDocs(collection(db, "users"));
  const baseDocs = usersSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...(data as Omit<WorkerWithAttendance, "id" | "name" | "checkIn" | "checkOut" | "nightCheckIn" | "nightCheckOut">),
      name: (data.fullName ?? data.name ?? "") as string,
    };
  });

  return Promise.all(
    baseDocs.map(async (worker) => {
      const [checkInSnap, checkOutSnap, nightInSnap, nightOutSnap] = await Promise.all([
        getDoc(doc(db, "users", worker.id, "attendance", dateKey, "checkIn", "Morning")),
        getDoc(doc(db, "users", worker.id, "attendance", dateKey, "checkOut", "Morning")),
        getDoc(doc(db, "users", worker.id, "attendance", dateKey, "checkIn", "Night")),
        getDoc(doc(db, "users", worker.id, "attendance", dateKey, "checkOut", "Night")),
      ]);
      return {
        ...worker,
        checkIn: checkInSnap.exists() ? (checkInSnap.data().time as Timestamp) : null,
        checkOut: checkOutSnap.exists() ? ((checkOutSnap.data().timestamp ?? checkOutSnap.data().time) as Timestamp) : null,
        nightCheckIn: nightInSnap.exists() ? (nightInSnap.data().time as Timestamp) : null,
        nightCheckOut: nightOutSnap.exists() ? ((nightOutSnap.data().timestamp ?? nightOutSnap.data().time) as Timestamp) : null,
      } as WorkerWithAttendance;
    })
  );
}

export default function AttendancePage() {
  const { workers: liveWorkers, loading: liveLoading, subscribe } = useWorkersStore();
  const [hotel, setHotel] = useState("all");
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [pastWorkers, setPastWorkers] = useState<WorkerWithAttendance[] | null>(null);
  const [pastLoading, setPastLoading] = useState(false);
  const [modalWorker, setModalWorker] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const unsub = subscribe();
    return unsub;
  }, [subscribe]);

  const isToday = selectedDate === todayKey();
  const workers = isToday ? liveWorkers : (pastWorkers ?? []);
  const loading = isToday ? liveLoading : pastLoading;

  const loadPastDate = useCallback(async (dateKey: string) => {
    setPastLoading(true);
    setPastWorkers(null);
    const data = await fetchAttendanceForDate(dateKey);
    setPastWorkers(data);
    setPastLoading(false);
  }, []);

  useEffect(() => {
    if (!isToday) loadPastDate(selectedDate);
  }, [selectedDate, isToday, loadPastDate]);

  const hotels = Array.from(new Set(workers.map((w) => w.placeName).filter(Boolean))).sort();
  const filtered = hotel === "all" ? workers : workers.filter((w) => w.placeName === hotel);

  const handlePrev = () => setSelectedDate((d) => getPrevDay(d));
  const handleNext = () => { if (!isToday) setSelectedDate((d) => getNextDay(d)); };

  return (
    <div className="flex flex-col gap-3">
      {/* Filter bar */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <label className="text-[12px] text-muted">Filter by hotel</label>
        <select
          value={hotel}
          onChange={(e) => setHotel(e.target.value)}
          className="text-[12px] px-2 py-1 rounded-md text-text outline-none"
          style={{ border: "0.5px solid rgba(0,0,0,0.10)", background: "rgba(0,0,0,0.04)" }}
        >
          <option value="all">All hotels</option>
          {hotels.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
        <div className="ml-auto text-[12px] text-muted">
          Showing {filtered.length} worker{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table card */}
      <div
        className="rounded-xl px-[15px] py-[13px]"
        style={{ background: "var(--color-surface)", border: "0.5px solid rgba(0,0,0,0.10)" }}
      >
        {/* Header with date navigation */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-text">
            <IconUsers size={15} color="var(--color-acc)" />
            Attendance register
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              className="p-0.5 rounded hover:bg-canvas transition-colors"
              title="Previous day"
            >
              <IconChevronLeft size={15} color="var(--color-muted)" />
            </button>
            <span className="text-[12px] text-text font-medium min-w-[170px] text-center">
              {formatDateKey(selectedDate)}
            </span>
            <button
              onClick={handleNext}
              disabled={isToday}
              className="p-0.5 rounded hover:bg-canvas transition-colors disabled:opacity-30"
              title="Next day"
            >
              <IconChevronRight size={15} color="var(--color-muted)" />
            </button>
            <button className="text-[12px] text-acc-txt ml-2">Export</button>
          </div>
        </div>

        <table className="w-full text-[12px] border-collapse" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th className="text-left text-muted font-medium pb-1.5 w-[24%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Worker</th>
              <th className="text-left text-muted font-medium pb-1.5 w-[18%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Hotel</th>
              <th className="text-left text-muted font-medium pb-1.5 w-[14%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Status</th>
              <th className="text-left text-muted font-medium pb-1.5 w-[16%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Check-in</th>
              <th className="text-left text-muted font-medium pb-1.5 w-[16%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Check-out</th>
              <th className="text-left text-muted font-medium pb-1.5 w-[12%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Duration</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="text-center text-muted py-6">Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center text-muted py-6">No workers found</td></tr>
            )}
            {filtered.map((w) => {
              const status = getAttendanceStatus(w.checkIn, w.nightCheckIn, w.checkOut, w.nightCheckOut);

              const hasMorning = Boolean(w.checkIn);
              const hasNight = Boolean(w.nightCheckIn);
              const primaryCheckIn = hasMorning ? w.checkIn : w.nightCheckIn;
              const primaryCheckOut = hasMorning ? w.checkOut : w.nightCheckOut;

              const duration = primaryCheckIn ? calcDuration(primaryCheckIn, primaryCheckOut) : null;

              return (
                <tr key={w.id}>
                  <td className="py-2" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                    <div className="flex items-center gap-1.5">
                      <Avatar userId={w.id} name={w.name} size={24} />
                      <button
                        onClick={() => setModalWorker({ id: w.id, name: w.name })}
                        className="truncate text-acc-txt hover:underline text-left"
                      >
                        {w.name}
                      </button>
                    </div>
                  </td>
                  <td className="py-2 text-muted" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>{w.placeName}</td>
                  <td className="py-2" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                    <StatusBadge status={status} />
                  </td>
                  <td className="py-2" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                    <div className="flex flex-col gap-0.5">
                      {hasMorning && (
                        <span className="text-muted">
                          {formatTime(w.checkIn!)}
                          {hasNight && <span className="ml-1 text-[10px] opacity-50">M</span>}
                        </span>
                      )}
                      {hasNight && (
                        <span className={hasMorning ? "text-[11px] text-muted opacity-60" : "text-muted"}>
                          {formatTime(w.nightCheckIn!)}
                          <span className="ml-1 text-[10px] opacity-50">N</span>
                        </span>
                      )}
                      {!hasMorning && !hasNight && <span className="text-muted">–</span>}
                    </div>
                  </td>
                  <td className="py-2" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                    <div className="flex flex-col gap-0.5">
                      {hasMorning && (
                        <span className="text-muted">
                          {w.checkOut ? formatTime(w.checkOut) : "–"}
                          {hasNight && <span className="ml-1 text-[10px] opacity-50">M</span>}
                        </span>
                      )}
                      {hasNight && (
                        <span className={hasMorning ? "text-[11px] text-muted opacity-60" : "text-muted"}>
                          {w.nightCheckOut ? formatTime(w.nightCheckOut) : "–"}
                          <span className="ml-1 text-[10px] opacity-50">N</span>
                        </span>
                      )}
                      {!hasMorning && !hasNight && <span className="text-muted">–</span>}
                    </div>
                  </td>
                  <td className="py-2 text-muted" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                    {duration ?? "–"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalWorker && (
        <WorkerAttendanceModal
          workerId={modalWorker.id}
          workerName={modalWorker.name}
          onClose={() => setModalWorker(null)}
        />
      )}
    </div>
  );
}
