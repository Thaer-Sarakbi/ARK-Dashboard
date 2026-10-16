"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconWallet, IconInfoCircle } from "@tabler/icons-react";
import { useAdvancesStore } from "@/store/useAdvancesStore";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRM } from "@/lib/utils";
import type { AdvanceStatus } from "@/lib/types";

type Filter = "All" | AdvanceStatus;

const FILTER_TABS: Filter[] = ["All", "Pending", "Approved", "Rejected"];

export default function SalaryAdvancesPage() {
  const { advances, loading, error, subscribe } = useAdvancesStore();
  const [activeFilter, setActiveFilter] = useState<Filter>("All");

  useEffect(() => subscribe(), [subscribe]);

  const filtered =
    activeFilter === "All" ? advances : advances.filter((a) => a.status === activeFilter);

  const cellBorder = { borderBottom: "0.5px solid rgba(0,0,0,0.06)" };
  const headBorder = { borderBottom: "0.5px solid rgba(0,0,0,0.10)" };

  return (
    <div className="flex flex-col gap-3">
      {/* Status filter tabs */}
      <div className="flex items-center gap-1 p-0.5 rounded-lg self-start" style={{ background: "rgba(0,0,0,0.05)" }}>
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className="text-[12px] px-3 py-1.5 rounded-md transition-colors font-medium"
            style={
              activeFilter === tab
                ? { background: "var(--color-surface)", color: "var(--color-acc)", boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }
                : { color: "var(--color-muted)" }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      <div
        className="rounded-xl px-[15px] py-[13px] overflow-x-auto"
        style={{ background: "var(--color-surface)", border: "0.5px solid rgba(0,0,0,0.10)" }}
      >
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-text mb-2.5">
          <IconWallet size={15} color="var(--color-acc)" />
          {activeFilter === "All" ? "All salary advances" : `${activeFilter} salary advances`}
        </div>

        <table className="w-full min-w-[560px] text-[12px] border-collapse" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th className="text-left text-muted font-medium pb-1.5 w-[30%]" style={headBorder}>Title</th>
              <th className="text-left text-muted font-medium pb-1.5 w-[20%]" style={headBorder}>Requested by</th>
              <th className="text-left text-muted font-medium pb-1.5 w-[20%]" style={headBorder}>Location</th>
              <th className="text-left text-muted font-medium pb-1.5 w-[15%]" style={headBorder}>Amount</th>
              <th className="text-left text-muted font-medium pb-1.5 w-[15%]" style={headBorder}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="text-center text-muted py-6">Loading…</td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={5} className="text-center text-err py-6">{error}</td></tr>
            )}
            {!loading && !error && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted py-6">
                  No {activeFilter === "All" ? "" : `${activeFilter.toLowerCase()} `}salary advances
                </td>
              </tr>
            )}
            {filtered.map((a) => (
              <tr key={`${a.userId}/${a.id}`} className="hover:bg-canvas transition-colors">
                <td className="py-2" style={cellBorder}>
                  <Link
                    href={`/salary-advances/${a.userId}/${a.id}`}
                    className="font-medium text-acc-txt block truncate hover:underline"
                  >
                    {a.title || "Untitled"}
                  </Link>
                </td>
                <td className="py-2 truncate" style={cellBorder}>{a.requestedBy ?? "–"}</td>
                <td className="py-2 text-muted truncate" style={cellBorder}>{a.location ?? "–"}</td>
                <td className="py-2" style={cellBorder}>{formatRM(a.amount)}</td>
                <td className="py-2" style={cellBorder}>
                  {a.status ? <StatusBadge status={a.status} /> : <span className="text-muted">–</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center gap-1 text-[11px] text-muted mt-2">
          <IconInfoCircle size={12} />
          Click any title to view details
        </div>
      </div>
    </div>
  );
}
