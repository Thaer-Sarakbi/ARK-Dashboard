import type { Timestamp } from "firebase/firestore";
import type { TaskStatus } from "./types";

export function todayKey(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export function formatTime(ts: Timestamp): string {
  const d = ts.toDate();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function calcDuration(checkIn: Timestamp, checkOut: Timestamp | null): string | null {
  if (!checkOut) {
    const diffMs = Date.now() - checkIn.toDate().getTime();
    if (diffMs > 24 * 60 * 60 * 1000) return null;
    const totalMins = Math.floor(diffMs / 60000);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h}h ${m}m`;
  }
  const diffMs = checkOut.toDate().getTime() - checkIn.toDate().getTime();
  const totalMins = Math.floor(diffMs / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h}h ${m}m`;
}

export function getAttendanceStatus(
  checkIn: Timestamp | null,
  nightCheckIn?: Timestamp | null,
  checkOut?: Timestamp | null,
  nightCheckOut?: Timestamp | null,
): "Present" | "Absent" | "Finished" {
  const hasAnyCheckIn = !!(checkIn || nightCheckIn);
  if (!hasAnyCheckIn) return "Absent";

  const now = Date.now();
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  const morningActive = !!checkIn && !checkOut;
  const nightActive = !!nightCheckIn && !nightCheckOut;

  // Night shift: stay Present until explicit checkout — no time cap
  if (nightActive) return "Present";

  // Morning shift: Present while within 24h of check-in
  if (morningActive && checkIn && now - checkIn.toDate().getTime() < TWENTY_FOUR_HOURS) return "Present";

  const hasCompletedShift = (!!checkIn && !!checkOut) || (!!nightCheckIn && !!nightCheckOut);
  if (hasCompletedShift) return "Finished";

  return "Absent";
}

export function getInitials(name: string): string {
  return (name ?? "")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatDate(ts: Timestamp): string {
  return ts.toDate().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function statusPillClass(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    "Not Started": "bg-acc-bg text-acc-txt",
    "In progress": "bg-ok-bg text-ok",
    Delayed: "bg-warn-bg text-warn",
    Completed: "bg-ok-bg text-ok",
    Urgent: "bg-err-bg text-err",
  };
  return map[status] ?? "bg-acc-bg text-acc-txt";
}

// Digits-only number for wa.me links, with Malaysia's 60 country code prepended when missing
export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("60")) return digits;
  return `60${digits.replace(/^0+/, "")}`;
}

export function formatRM(amount: number | undefined): string {
  return `RM ${(Number(amount) || 0).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function advancePillClass(status: "Pending" | "Approved" | "Rejected"): string {
  const map: Record<string, string> = {
    Pending:  "bg-warn-bg text-warn",
    Approved: "bg-ok-bg text-ok",
    Rejected: "bg-err-bg text-err",
  };
  return map[status] ?? "";
}

export function attendancePillClass(status: "Present" | "Absent" | "Finished"): string {
  const map: Record<string, string> = {
    Present:  "bg-ok-bg text-ok",
    Absent:   "bg-err-bg text-err",
    Finished: "bg-fin-bg text-fin",
  };
  return map[status] ?? "";
}

export function dateKeyFromDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export function getPrevDay(key: string): string {
  const [dd, mm, yyyy] = key.split("-").map(Number);
  const d = new Date(yyyy, mm - 1, dd);
  d.setDate(d.getDate() - 1);
  return dateKeyFromDate(d);
}

export function getNextDay(key: string): string {
  const [dd, mm, yyyy] = key.split("-").map(Number);
  const d = new Date(yyyy, mm - 1, dd);
  d.setDate(d.getDate() + 1);
  return dateKeyFromDate(d);
}

export function formatDateKey(key: string): string {
  const [dd, mm, yyyy] = key.split("-").map(Number);
  const d = new Date(yyyy, mm - 1, dd);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateKeyShort(key: string): string {
  const [dd, mm, yyyy] = key.split("-").map(Number);
  const d = new Date(yyyy, mm - 1, dd);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function getLastNDaysKeys(n: number): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    keys.push(dateKeyFromDate(d));
  }
  return keys;
}

export function getMonthToDateKeys(): string[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const keys: string[] = [];
  for (let day = 1; day <= today; day++) {
    keys.push(dateKeyFromDate(new Date(year, month, day)));
  }
  return keys;
}

export function severityPillClass(severity: string): string {
  const map: Record<string, string> = {
    high: "bg-err-bg text-err",
    medium: "bg-warn-bg text-warn",
    low: "bg-acc-bg text-acc-txt",
  };
  return map[severity] ?? "bg-acc-bg text-acc-txt";
}

export function progressBarColor(progress: number): string {
  if (progress >= 70) return "bg-acc";
  if (progress >= 40) return "bg-warn";
  return "bg-err";
}

export const Hotels = [ 'AMPANG H2', 'AMPANG TESCO', 'BUKIT BERU', 'CAMERON', 'DOLOMITE', 'HARTAMAS H2', 'KUALA SELANGOR', 'MELAWATHI H3', 'NEW RAWANG', 'LUMUT', 'NILAI H2', 'PUTRA HEIGHT', 'SAMUDRA', 'SHAH ALAM H1', 'SHAH ALAM H2', 'SUNGAI BESI H1', 'AMPANG H1', 'DE GLORY', 'HARTAMAS H1', 'KAJANG STAR', 'KDH 1',
'KDH 2',
'MELAKKA',
'MELAWATHI H2',
'NEW KAJANG',
'NEW RAWANG', 
'SUBANG',
'SG BESI H2',
'SERANDAH',
'PUCHONG',
'ARK RAWANG',
'BANTING', 
'ARK Porkdickson', 
'Avani sepang goldcost', 
'Ampang 3 tower Office', 
'Batu Caves Office', 
'Not Spesific'
]