import * as XLSX from "xlsx";
import type { SalesAmountKey, SalesDoc } from "@/lib/types";
import { fetchSalesForDate } from "@/lib/salesData";
import { formatDateKey, getMonthToDateKeys, Hotels } from "@/lib/utils";

const FIELD_LABELS: { key: SalesAmountKey; label: string }[] = [
  { key: "totalSales", label: "Total Sales" },
  { key: "totalExpenses", label: "Total Expenses" },
  { key: "banking", label: "Banking" },
  { key: "emptyRooms", label: "Empty Rooms" },
  { key: "onlineBooking", label: "Online Booking" },
];

function zeroTotals(): Record<SalesAmountKey, number> {
  return { totalSales: 0, totalExpenses: 0, banking: 0, emptyRooms: 0, onlineBooking: 0 };
}

function addInto(target: Record<SalesAmountKey, number>, h: SalesDoc) {
  for (const f of FIELD_LABELS) target[f.key] += h[f.key];
}

function hotelRow(hotel: string, totals: Record<SalesAmountKey, number>) {
  const row: Record<string, string | number> = { Hotel: hotel };
  for (const f of FIELD_LABELS) row[f.label] = totals[f.key];
  return row;
}

export function exportDailySalesExcel(dateKey: string, items: SalesDoc[]) {
  const rows = items.map((h) => hotelRow(h.hotel, h));

  const grand = zeroTotals();
  for (const h of items) addInto(grand, h);
  rows.push(hotelRow("TOTAL", grand));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Daily Sales");
  XLSX.writeFile(wb, `daily-sales-${dateKey}.xlsx`);
}

export async function exportMonthToDateSalesExcel(): Promise<void> {
  const dateKeys = getMonthToDateKeys();

  const perDate = await Promise.all(
    dateKeys.map(async (dateKey) => ({
      dateKey,
      items: await fetchSalesForDate(dateKey, Hotels),
    }))
  );

  const detailRows: Record<string, string | number>[] = [];
  const totalsByHotel = new Map<string, Record<SalesAmountKey, number>>();
  const grand = zeroTotals();

  for (const { dateKey, items } of perDate) {
    for (const h of items) {
      const row: Record<string, string | number> = { Date: formatDateKey(dateKey), Hotel: h.hotel };
      for (const f of FIELD_LABELS) row[f.label] = h[f.key];
      detailRows.push(row);

      if (!totalsByHotel.has(h.hotel)) totalsByHotel.set(h.hotel, zeroTotals());
      addInto(totalsByHotel.get(h.hotel)!, h);
      addInto(grand, h);
    }
  }

  const hotelTotalRows = Array.from(totalsByHotel.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hotel, totals]) => hotelRow(hotel, totals));
  hotelTotalRows.push(hotelRow("GRAND TOTAL", grand));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailRows), "Daily Detail");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hotelTotalRows), "Totals by Hotel");

  const first = dateKeys[0];
  const last = dateKeys[dateKeys.length - 1];
  XLSX.writeFile(wb, `monthly-sales-${first}_to_${last}.xlsx`);
}
