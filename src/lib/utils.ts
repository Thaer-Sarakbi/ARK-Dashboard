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
  checkIn: Timestamp | null
): "Present" | "Late" | "Absent" {
  if (!checkIn) return "Absent";
  const d = checkIn.toDate();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  if (hours < 9 || (hours === 9 && minutes === 0)) return "Present";
  return "Late";
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
    New: "bg-acc-bg text-acc-txt",
    "In progress": "bg-ok-bg text-ok",
    Delayed: "bg-warn-bg text-warn",
    Completed: "bg-ok-bg text-ok",
    Urgent: "bg-err-bg text-err",
  };
  return map[status] ?? "bg-acc-bg text-acc-txt";
}

export function attendancePillClass(status: "Present" | "Late" | "Absent"): string {
  const map = {
    Present: "bg-ok-bg text-ok",
    Late: "bg-warn-bg text-warn",
    Absent: "bg-err-bg text-err",
  };
  return map[status];
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
