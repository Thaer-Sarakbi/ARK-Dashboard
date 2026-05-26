"use client";

import { useEffect, useState } from "react";
import { IconBuilding, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useRoomStatusStore } from "@/store/useRoomStatusStore";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { todayKey, getPrevDay, getNextDay, formatDateKey } from "@/lib/utils";

export default function RoomsPage() {
  const { items, loading, fetchForDate } = useRoomStatusStore();
  const [selectedDate, setSelectedDate] = useState(todayKey());

  const isToday = selectedDate === todayKey();

  useEffect(() => {
    fetchForDate(selectedDate);
  }, [selectedDate, fetchForDate]);

  const totals = items.reduce(
    (acc, h) => ({
      staffRooms: acc.staffRooms + (h.staffRooms ?? 0),
      emptyRooms: acc.emptyRooms + (h.emptyRooms ?? 0),
      occupiedRooms: acc.occupiedRooms + (h.occupiedRooms ?? 0),
    }),
    { staffRooms: 0, emptyRooms: 0, occupiedRooms: 0 }
  );
  const totalAll = totals.staffRooms + totals.emptyRooms + totals.occupiedRooms;
  const totalPct = totalAll > 0 ? Math.round((totals.occupiedRooms / totalAll) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      <div
        className="rounded-xl px-[15px] py-[13px]"
        style={{ background: "var(--color-surface)", border: "0.5px solid rgba(0,0,0,0.10)" }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-text">
            <IconBuilding size={15} color="var(--color-acc)" />
            Room status · by hotel
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

        <table className="w-full text-[12px] border-collapse" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th className="text-left text-muted font-medium pb-1.5 w-[28%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Hotel name</th>
              <th className="text-left text-muted font-medium pb-1.5 w-[18%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Staff rooms</th>
              <th className="text-left text-muted font-medium pb-1.5 w-[18%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Empty rooms</th>
              <th className="text-left text-muted font-medium pb-1.5 w-[18%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Occupied</th>
              <th className="text-left text-muted font-medium pb-1.5 w-[18%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Occupancy</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="text-center text-muted py-6">Loading…</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={5} className="text-center text-muted py-6">No room data for this date</td></tr>
            )}
            {items.map((h) => {
              const total = (h.staffRooms ?? 0) + (h.occupiedRooms ?? 0) + (h.emptyRooms ?? 0);
              const pct = total > 0 ? Math.round(((h.occupiedRooms ?? 0) / total) * 100) : 0;
              return (
                <tr key={h.id}>
                  <td className="py-2 font-medium" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>{h.hotel}</td>
                  <td className="py-2" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>{h.staffRooms ?? 0}</td>
                  <td className="py-2 font-medium text-warn" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>{h.emptyRooms ?? 0}</td>
                  <td className="py-2" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>{h.occupiedRooms ?? 0}</td>
                  <td className="py-2" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                    <ProgressBar value={pct} width={70} />
                  </td>
                </tr>
              );
            })}
            {items.length > 0 && (
              <tr className="font-medium">
                <td className="pt-2.5">Total</td>
                <td className="pt-2.5">{totals.staffRooms}</td>
                <td className="pt-2.5 text-warn">{totals.emptyRooms}</td>
                <td className="pt-2.5">{totals.occupiedRooms}</td>
                <td className="pt-2.5"><ProgressBar value={totalPct} width={70} /></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
