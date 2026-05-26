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

export function calcDuration(checkIn: Timestamp, checkOut: Timestamp | null): string {
  if (!checkOut) {
    const diffMs = Date.now() - checkIn.toDate().getTime();
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
  nightCheckIn?: Timestamp | null
): "Present" | "Absent" {
  if (checkIn || nightCheckIn) return "Present";
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

export function attendancePillClass(status: "Present" | "Absent"): string {
  const map = {
    Present: "bg-ok-bg text-ok",
    Absent: "bg-err-bg text-err",
  };
  return map[status];
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
