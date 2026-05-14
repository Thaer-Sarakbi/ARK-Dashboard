"use client";

import { useEffect } from "react";
import { IconBuilding } from "@tabler/icons-react";
import { useWorkersStore } from "@/store/useWorkersStore";
import { useReportsStore } from "@/store/useReportsStore";
import { ProgressBar } from "@/components/ui/ProgressBar";

export default function RoomsPage() {
  const { workers, subscribe } = useWorkersStore();
  const { analysis, analysisLoading, fetchReports } = useReportsStore();

  useEffect(() => {
    const unsub = subscribe();
    return unsub;
  }, [subscribe]);

  useEffect(() => {
    const admins = workers
      .filter((w) => w.admin)
      .map((w) => ({ id: w.id, name: w.name, placeName: w.placeName }));
    if (admins.length > 0) fetchReports(admins);
  }, [workers, fetchReports]);

  const hotels = analysis?.hotels ?? [];
  const totals = hotels.reduce(
    (acc, h) => ({
      staffRooms: acc.staffRooms + h.staffRooms,
      emptyRooms: acc.emptyRooms + h.emptyRooms,
      occupiedRooms: acc.occupiedRooms + h.occupiedRooms,
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
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-text">
            <IconBuilding size={14} color="var(--color-acc)" />
            Room status · by hotel
          </div>
          <div className="text-[10px] text-muted">Live · from admin reports</div>
        </div>

        <table className="w-full text-[11px] border-collapse" style={{ tableLayout: "fixed" }}>
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
            {analysisLoading && (
              <tr><td colSpan={5} className="text-center text-muted py-6">Analyzing reports…</td></tr>
            )}
            {!analysisLoading && hotels.length === 0 && (
              <tr><td colSpan={5} className="text-center text-muted py-6">No report data available yet</td></tr>
            )}
            {hotels.map((h) => {
              const total = h.staffRooms + h.occupiedRooms + h.emptyRooms;
              const pct = total > 0 ? Math.round((h.occupiedRooms / total) * 100) : 0;
              return (
                <tr key={h.hotelName}>
                  <td className="py-1.5 font-medium" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>{h.hotelName}</td>
                  <td className="py-1.5" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>{h.staffRooms}</td>
                  <td className="py-1.5 font-medium text-warn" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>{h.emptyRooms}</td>
                  <td className="py-1.5" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>{h.occupiedRooms}</td>
                  <td className="py-1.5" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                    <ProgressBar value={pct} width={70} />
                  </td>
                </tr>
              );
            })}
            {hotels.length > 0 && (
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
