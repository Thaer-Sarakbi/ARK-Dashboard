"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import {
  IconArrowLeft,
  IconWallet,
  IconChevronLeft,
  IconChevronRight,
  IconPhoto,
  IconBrandWhatsapp,
} from "@tabler/icons-react";
import { db } from "@/lib/firebase";
import { useStorageStore } from "@/store/useStorageStore";
import { useWorkersStore } from "@/store/useWorkersStore";
import { advanceCreatedMs } from "@/store/useAdvancesStore";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRM, toWhatsAppNumber } from "@/lib/utils";
import type { SalaryAdvance } from "@/lib/types";

function formatCreated(a: SalaryAdvance): string {
  const ms = advanceCreatedMs(a);
  if (!ms) return "–";
  return new Date(ms).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SalaryAdvanceDetailPage({
  params,
}: {
  params: Promise<{ userId: string; advanceId: string }>;
}) {
  const { userId, advanceId } = use(params);
  const { listFolder } = useStorageStore();
  const { workers, subscribe: subWorkers } = useWorkersStore();
  const [advance, setAdvance] = useState<SalaryAdvance | null>(null);
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [sliderIndex, setSliderIndex] = useState(0);

  useEffect(() => subWorkers(), [subWorkers]);

  const worker = workers.find((w) => w.id === userId);

  useEffect(() => {
    return onSnapshot(
      doc(db, "users", userId, "advances", advanceId),
      (snap) => {
        setAdvance(
          snap.exists()
            ? { id: snap.id, userId, ...(snap.data() as Omit<SalaryAdvance, "id" | "userId">) }
            : null
        );
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [userId, advanceId]);

  useEffect(() => {
    listFolder(`users/${userId}/advances/${advanceId}/files`, { fetchUrls: true }).then((items) => {
      setAttachments(items.map((i) => i.url).filter((u): u is string => Boolean(u)));
      setSliderIndex(0);
    });
  }, [userId, advanceId, listFolder]);

  const backLink = (
    <Link href="/salary-advances" className="flex items-center gap-1.5 text-[13px] text-acc-txt">
      <IconArrowLeft size={15} />
      Back to salary advances
    </Link>
  );

  if (!advance) {
    return (
      <div className="flex flex-col gap-3">
        {backLink}
        <div className="text-[13px] text-muted text-center py-10">
          {loading ? "Loading…" : "Salary advance not found"}
        </div>
      </div>
    );
  }

  const fields: { label: string; value: string }[] = [
    { label: "Amount", value: formatRM(advance.amount) },
    { label: "Requested by", value: advance.requestedBy ?? "–" },
    { label: "Location", value: advance.location ?? "–" },
    { label: "Created", value: formatCreated(advance) },
  ];

  return (
    <div className="flex flex-col gap-3">
      {backLink}

      <div
        className="rounded-xl px-[15px] py-[13px]"
        style={{ background: "var(--color-surface)", border: "0.5px solid rgba(0,0,0,0.10)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-text min-w-0">
            <IconWallet size={15} color="var(--color-acc)" className="flex-shrink-0" />
            <span className="truncate">{advance.title || "Untitled"}</span>
          </div>
          <div className="flex items-center gap-2">
            {advance.status && <StatusBadge status={advance.status} />}
            {worker?.phoneNumber && (
              <button
                onClick={() => {
                  const phone = toWhatsAppNumber(worker.phoneNumber!);
                  window.open(`https://wa.me/${phone}`, "_blank");
                }}
                className="flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-lg text-white"
                style={{ background: "#25D366" }}
              >
                <IconBrandWhatsapp size={14} />
                Send by WhatsApp
              </button>
            )}
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {fields.map((f) => (
            <div key={f.label}>
              <div className="text-[11px] font-medium text-muted uppercase tracking-wider mb-1">{f.label}</div>
              <div className="text-[14px] text-text">{f.value}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="mb-4">
          <div className="text-[11px] font-medium text-muted uppercase tracking-wider mb-2">Description</div>
          <div
            className="text-[13px] text-muted leading-relaxed px-3 py-2.5 rounded-lg whitespace-pre-wrap"
            style={{ background: "rgba(0,0,0,0.04)", border: "0.5px solid rgba(0,0,0,0.08)" }}
          >
            {advance.description || "No description provided."}
          </div>
        </div>

        {/* Attachments slider */}
        {attachments.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted uppercase tracking-wider mb-2">
              <IconPhoto size={13} />
              Attachments ({attachments.length})
            </div>
            <div className="relative rounded-lg overflow-hidden" style={{ background: "rgba(0,0,0,0.04)", border: "0.5px solid rgba(0,0,0,0.08)" }}>
              <div className="w-full" style={{ aspectRatio: "16/9" }}>
                <a href={attachments[sliderIndex]} target="_blank" rel="noopener noreferrer">
                  <img
                    src={attachments[sliderIndex]}
                    alt={`Attachment ${sliderIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                </a>
              </div>

              {attachments.length > 1 && (
                <>
                  <button
                    onClick={() => setSliderIndex((i) => (i - 1 + attachments.length) % attachments.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-1.5"
                    style={{ background: "rgba(0,0,0,0.45)" }}
                  >
                    <IconChevronLeft size={16} color="white" />
                  </button>
                  <button
                    onClick={() => setSliderIndex((i) => (i + 1) % attachments.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5"
                    style={{ background: "rgba(0,0,0,0.45)" }}
                  >
                    <IconChevronRight size={16} color="white" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {attachments.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSliderIndex(i)}
                        className="w-1.5 h-1.5 rounded-full transition-all"
                        style={{ background: i === sliderIndex ? "white" : "rgba(255,255,255,0.45)" }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
