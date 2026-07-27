"use client";

import { useEffect, useState } from "react";
import { IconCash, IconChevronLeft, IconChevronRight, IconFileSpreadsheet } from "@tabler/icons-react";
import { useSalesStore } from "@/store/useSalesStore";
import { todayKey, getPrevDay, getNextDay, formatDateKey } from "@/lib/utils";
import { exportDailySalesExcel, exportMonthToDateSalesExcel } from "@/lib/exportSales";
import type { SalesDoc } from "@/lib/types";

function formatAmount(n: number): string {
  return `${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RM`;
}

const FIELDS: { key: keyof Omit<SalesDoc, "hotel">; label: string }[] = [
  { key: "before", label: "C/F Before" },
  { key: "totalSales", label: "Total Sales" },
  { key: "totalExpenses", label: "Total Expenses" },
  { key: "banking", label: "Banking" },
  { key: "after", label: "C/F After" },
];

export default function DailySalesPage() {
  const { items, loading, fetchForDate } = useSalesStore();
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [exportingMonth, setExportingMonth] = useState(false);

  const isToday = selectedDate === todayKey();

  useEffect(() => {
    fetchForDate(selectedDate);
  }, [selectedDate, fetchForDate]);

  const handleExportDay = () => exportDailySalesExcel(selectedDate, items);

  const handleExportMonth = async () => {
    setExportingMonth(true);
    try {
      await exportMonthToDateSalesExcel();
    } finally {
      setExportingMonth(false);
    }
  };

  const totals = FIELDS.reduce((acc, f) => {
    acc[f.key] = items.reduce((sum, h) => sum + (h[f.key] ?? 0), 0);
    return acc;
  }, {} as Record<keyof Omit<SalesDoc, "hotel">, number>);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-text">
          <IconCash size={15} color="var(--color-acc)" />
          Daily sales · by hotel
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

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleExportDay}
          disabled={loading || items.length === 0}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-text hover:bg-canvas transition-colors disabled:opacity-30"
          style={{ border: "0.5px solid rgba(0,0,0,0.10)" }}
        >
          <IconFileSpreadsheet size={14} color="var(--color-acc)" />
          Export day
        </button>
        <button
          onClick={handleExportMonth}
          disabled={exportingMonth}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-text hover:bg-canvas transition-colors disabled:opacity-30"
          style={{ border: "0.5px solid rgba(0,0,0,0.10)" }}
        >
          <IconFileSpreadsheet size={14} color="var(--color-acc)" />
          {exportingMonth ? "Exporting…" : "Export month to date"}
        </button>
      </div>

      {loading && (
        <div
          className="rounded-xl px-[15px] py-[13px] text-center text-[12px] text-muted"
          style={{ background: "var(--color-surface)", border: "0.5px solid rgba(0,0,0,0.10)" }}
        >
          Loading…
        </div>
      )}

      {!loading && items.length === 0 && (
        <div
          className="rounded-xl px-[15px] py-[13px] text-center text-[12px] text-muted"
          style={{ background: "var(--color-surface)", border: "0.5px solid rgba(0,0,0,0.10)" }}
        >
          No sales data for this date
        </div>
      )}

      {!loading &&
        items.map((h) => (
          <div
            key={h.hotel}
            className="rounded-xl px-[15px] py-[13px]"
            style={{ background: "var(--color-surface)", border: "0.5px solid rgba(0,0,0,0.10)" }}
          >
            <div className="flex items-center gap-1.5 text-[13px] font-medium text-text mb-2.5">
              <IconCash size={15} color="var(--color-acc)" />
              {h.hotel}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <div className="text-[11px] text-muted mb-[3px]">{f.label}</div>
                  <div className="text-[15px] font-medium text-text">{formatAmount(h[f.key])}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

      {!loading && items.length > 0 && (
        <div
          className="rounded-xl px-[15px] py-[13px]"
          style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-acc)" }}
        >
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-text mb-2.5">
            <IconCash size={15} color="var(--color-acc)" />
            Total · all hotels
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <div className="text-[11px] text-muted mb-[3px]">{f.label}</div>
                <div className="text-[15px] font-medium text-acc-txt">{formatAmount(totals[f.key])}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
