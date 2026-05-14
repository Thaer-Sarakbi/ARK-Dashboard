"use client";

import { usePathname } from "next/navigation";
import { IconSearch, IconBell } from "@tabler/icons-react";

const TITLES: Record<string, string> = {
  "/overview": "Dashboard",
  "/attendance": "Attendance",
  "/tasks": "Task tracker",
  "/rooms": "Room status",
  "/complaints": "Complaints",
  "/reports": "Daily reports",
};

function getTitle(pathname: string): string {
  if (pathname.startsWith("/tasks/")) return "Task details";
  return TITLES[pathname] ?? "Dashboard";
}

function todayLabel(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function Topbar() {
  const pathname = usePathname();

  return (
    <header
      className="h-[52px] flex items-center px-[18px] gap-2.5 flex-shrink-0"
      style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)", background: "#fff" }}
    >
      <div className="flex-1 text-[14px] font-medium text-text">
        {getTitle(pathname)}
      </div>

      <span
        className="text-[10px] font-medium px-2.5 py-[3px] rounded-full"
        style={{ background: "var(--color-date-bg)", color: "var(--color-date-txt)" }}
      >
        {todayLabel()}
      </span>

      <button
        className="w-7 h-7 rounded-[7px] flex items-center justify-center text-muted transition-colors hover:bg-canvas"
        style={{ border: "0.5px solid rgba(0,0,0,0.10)" }}
        aria-label="Search"
      >
        <IconSearch size={14} />
      </button>

      <button
        className="w-7 h-7 rounded-[7px] flex items-center justify-center text-muted transition-colors hover:bg-canvas relative"
        style={{ border: "0.5px solid rgba(0,0,0,0.10)" }}
        aria-label="Notifications"
      >
        <IconBell size={14} />
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-err" />
      </button>
    </header>
  );
}
