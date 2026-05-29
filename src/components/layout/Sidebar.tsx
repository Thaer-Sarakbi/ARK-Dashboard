"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  IconLayoutDashboard,
  IconUsers,
  IconClipboardList,
  IconBuilding,
  IconMessageReport,
  IconFileText,
  IconBuildingSkyscraper,
} from "@tabler/icons-react";
import { useUserStore } from "@/store/useUserStore";
import { getInitials } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";

const NAV_ITEMS = [
  { href: "/overview", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/attendance", label: "Attendance", icon: IconUsers },
  { href: "/tasks", label: "Task tracker", icon: IconClipboardList },
  { href: "/rooms", label: "Room status", icon: IconBuilding },
  { href: "/complaints", label: "Complaints", icon: IconMessageReport },
  { href: "/reports", label: "Daily reports", icon: IconFileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const profile = useUserStore((s) => s.profile);
  const { isOpen, close } = useSidebar();

  const name = profile?.name ?? "Admin";
  const role = profile?.role ?? "Operations Manager";

  // Close drawer on route change
  useEffect(() => {
    close();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={close}
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 w-[196px] flex-shrink-0 flex flex-col",
          "transition-transform duration-300 ease-in-out",
          "md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        style={{ background: "var(--color-sidebar-bg)" }}
      >
        {/* Brand */}
        <div className="px-3.5 pt-3.5 pb-2.5" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "var(--color-acc)" }}>
              <IconBuildingSkyscraper size={13} color="#fff" />
            </div>
            <div>
              <div className="text-[13px] font-medium" style={{ color: "#E8F0F8" }}>WorkCore</div>
              <div className="text-[10px]" style={{ color: "var(--color-sidebar-sec)" }}>Operations Hub</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-1.5 overflow-y-auto">
          <div className="px-3 pt-1.5 pb-0.5 text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--color-sidebar-sec)" }}>
            Overview
          </div>
          {NAV_ITEMS.slice(0, 2).map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}

          <div className="px-3 pt-3 pb-0.5 text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--color-sidebar-sec)" }}>
            Operations
          </div>
          {NAV_ITEMS.slice(2).map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 py-2.5 flex items-center gap-2" style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0"
            style={{ background: "rgba(24,95,165,0.4)", color: "#7BBFFF" }}
          >
            {getInitials(name)}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium truncate" style={{ color: "#E8F0F8" }}>{name}</div>
            <div className="text-[10px] truncate" style={{ color: "var(--color-sidebar-sec)" }}>{role}</div>
          </div>
        </div>
      </aside>
    </>
  );
}

function NavLink({
  item,
  pathname,
}: {
  item: { href: string; label: string; icon: React.ComponentType<{ size?: number }> };
  pathname: string;
}) {
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="flex items-center gap-2 mx-1 px-3 py-[7px] rounded-md text-[12px] transition-colors"
      style={{
        color: active ? "var(--color-sidebar-active-txt)" : "var(--color-sidebar-text)",
        background: active ? "var(--color-sidebar-active-bg)" : "transparent",
        fontWeight: active ? 500 : 400,
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <Icon size={15} />
      {item.label}
    </Link>
  );
}
