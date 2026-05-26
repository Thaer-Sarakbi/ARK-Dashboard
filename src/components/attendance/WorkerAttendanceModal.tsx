"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, type Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { IconX, IconUser } from "@tabler/icons-react";
import { dateKeyFromDate, formatTime } from "@/lib/utils";

interface DayRecord {
  date: Date;
  dateKey: string;
  morningCheckIn: Timestamp | null;
  morningCheckOut: Timestamp | null;
  nightCheckIn: Timestamp | null;
  nightCheckOut: Timestamp | null;
  isPresent: boolean;
  isFuture: boolean;
}

interface Props {
  workerId: string;
  workerName: string;
  onClose: () => void;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function WorkerAttendanceModal({ workerId, workerName, onClose }: Props) {
  const [records, setRecords] = useState<DayRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const today = new Date(year, month, now.getDate());

      const days: Date[] = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));

      const fetched = await Promise.all(
        days.map(async (date) => {
          const isFuture = date > today;
          const dateKey = dateKeyFromDate(date);

          if (isFuture) {
            return { date, dateKey, morningCheckIn: null, morningCheckOut: null, nightCheckIn: null, nightCheckOut: null, isPresent: false, isFuture: true } as DayRecord;
          }

          const [mInSnap, mOutSnap, nInSnap, nOutSnap] = await Promise.all([
            getDoc(doc(db, "users", workerId, "attendance", dateKey, "checkIn", "Morning")),
            getDoc(doc(db, "users", workerId, "attendance", dateKey, "checkOut", "Morning")),
            getDoc(doc(db, "users", workerId, "attendance", dateKey, "checkIn", "Night")),
            getDoc(doc(db, "users", workerId, "attendance", dateKey, "checkOut", "Night")),
          ]);

          const morningCheckIn = mInSnap.exists() ? (mInSnap.data().time as Timestamp) : null;
          const morningCheckOut = mOutSnap.exists() ? ((mOutSnap.data().timestamp ?? mOutSnap.data().time) as Timestamp) : null;
          const nightCheckIn = nInSnap.exists() ? (nInSnap.data().time as Timestamp) : null;
          const nightCheckOut = nOutSnap.exists() ? ((nOutSnap.data().timestamp ?? nOutSnap.data().time) as Timestamp) : null;

          const isPresent =
            (morningCheckIn !== null && morningCheckOut !== null) ||
            (nightCheckIn !== null && nightCheckOut !== null);

          return { date, dateKey, morningCheckIn, morningCheckOut, nightCheckIn, nightCheckOut, isPresent, isFuture: false };
        })
      );

      setRecords(fetched);
      setLoading(false);
    }

    load();
  }, [workerId]);

  const now = new Date();
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  const presentCount = records.filter((r) => r.isPresent).length;
  const absentCount = records.filter((r) => !r.isPresent && !r.isFuture).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.40)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col"
        style={{ background: "var(--color-surface)", border: "0.5px solid rgba(0,0,0,0.12)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}
        >
          <div className="flex items-center gap-2 text-[13px] font-medium text-text">
            <IconUser size={15} color="var(--color-acc)" />
            {workerName} · {monthLabel}
          </div>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors">
            <IconX size={16} />
          </button>
        </div>

        {/* Summary */}
        <div className="flex gap-4 px-4 py-2.5" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
          <span className="text-[12px]">
            <span className="font-semibold text-ok">{presentCount}</span>
            <span className="text-muted ml-1">Present</span>
          </span>
          <span className="text-[12px]">
            <span className="font-semibold text-err">{absentCount}</span>
            <span className="text-muted ml-1">Absent</span>
          </span>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center text-muted text-[12px] py-8">Loading…</div>
          ) : (
            <table className="w-full text-[12px] border-collapse">
              <thead className="sticky top-0" style={{ background: "var(--color-surface)" }}>
                <tr>
                  <th className="text-left text-muted font-medium px-4 py-2 w-[12%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Day</th>
                  <th className="text-left text-muted font-medium px-2 py-2 w-[20%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Date</th>
                  <th className="text-left text-muted font-medium px-2 py-2 w-[22%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Check-in</th>
                  <th className="text-left text-muted font-medium px-2 py-2 w-[22%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Check-out</th>
                  <th className="text-left text-muted font-medium px-2 py-2 w-[24%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const rowBg = r.isPresent ? "rgba(58,109,17,0.05)" : "rgba(163,45,45,0.05)";
                  return (
                    <tr key={r.dateKey} style={{ background: rowBg }}>
                      <td className="px-4 py-1.5 text-muted" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.04)" }}>
                        {DAY_NAMES[r.date.getDay()]}
                      </td>
                      <td className="px-2 py-1.5" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.04)" }}>
                        {r.date.getDate()} {MONTH_NAMES[r.date.getMonth()].slice(0, 3)}
                      </td>
                      <td className="px-2 py-1.5 text-muted" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.04)" }}>
                        {r.morningCheckIn || r.nightCheckIn ? (
                          <div className="flex flex-col gap-0.5">
                            {r.morningCheckIn && (
                              <span>{formatTime(r.morningCheckIn)} <span className="text-[10px] opacity-50">M</span></span>
                            )}
                            {r.nightCheckIn && (
                              <span>{formatTime(r.nightCheckIn)} <span className="text-[10px] opacity-50">N</span></span>
                            )}
                          </div>
                        ) : "–"}
                      </td>
                      <td className="px-2 py-1.5 text-muted" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.04)" }}>
                        {r.morningCheckIn || r.nightCheckIn ? (
                          <div className="flex flex-col gap-0.5">
                            {r.morningCheckIn && (
                              <span>{r.morningCheckOut ? formatTime(r.morningCheckOut) : "–"} <span className="text-[10px] opacity-50">M</span></span>
                            )}
                            {r.nightCheckIn && (
                              <span>{r.nightCheckOut ? formatTime(r.nightCheckOut) : "–"} <span className="text-[10px] opacity-50">N</span></span>
                            )}
                          </div>
                        ) : "–"}
                      </td>
                      <td className="px-2 py-1.5" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.04)" }}>
                        {r.isPresent ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-ok-bg text-ok">Present</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-err-bg text-err">Absent</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
