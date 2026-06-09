"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";
import {
  IconArrowLeft,
  IconClipboardText,
  IconChevronLeft,
  IconChevronRight,
  IconPhoto,
  IconBrandWhatsapp,
} from "@tabler/icons-react";
import { useTasksStore } from "@/store/useTasksStore";
import { useWorkersStore } from "@/store/useWorkersStore";
import { useStorageStore } from "@/store/useStorageStore";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { TaskStatus } from "@/lib/types";

function getTaskStatus(task: { Status?: TaskStatus; status?: TaskStatus }): TaskStatus {
  return task.Status ?? task.status ?? "Not Started";
}

export default function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = use(params);
  const { tasks, subscribe } = useTasksStore();
  const { workers, subscribe: subWorkers } = useWorkersStore();
  const { listFolder } = useStorageStore();
  const [attachments, setAttachments] = useState<string[]>([]);
  const [sliderIndex, setSliderIndex] = useState(0);

  useEffect(() => {
    const u1 = subscribe();
    const u2 = subWorkers();
    return () => { u1(); u2(); };
  }, [subscribe, subWorkers]);

  const task = tasks.find((t) => t.id === taskId);
  const worker = workers.find((w) => w.id === (task?.assignedToId ?? task?.assignedTo));

  useEffect(() => {
    if (!task) return;
    const uid = task.assignedToId ?? task.userId;
    if (!uid) return;
    listFolder(`users/${uid}/tasks/${taskId}/files`, { fetchUrls: true }).then((items) => {
      setAttachments(items.map((i) => i.url).filter((u): u is string => Boolean(u)));
      setSliderIndex(0);
    });
  }, [task, taskId, listFolder]);

  if (!task) {
    return (
      <div className="flex flex-col gap-3">
        <Link href="/tasks" className="flex items-center gap-1.5 text-[13px] text-acc-txt">
          <IconArrowLeft size={15} />
          Back to task tracker
        </Link>
        <div className="text-[13px] text-muted text-center py-10">Task not found</div>
      </div>
    );
  }

  const dur = task.duration;
  const durLabel = dur ? `${dur} day${dur !== 1 ? "s" : ""}` : "–";

  return (
    <div className="flex flex-col gap-3">
      <Link href="/tasks" className="flex items-center gap-1.5 text-[13px] text-acc-txt">
        <IconArrowLeft size={15} />
        Back to task tracker
      </Link>

      <div
        className="rounded-xl px-[15px] py-[13px]"
        style={{ background: "var(--color-surface)", border: "0.5px solid rgba(0,0,0,0.10)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-text">
            <IconClipboardText size={15} color="var(--color-acc)" />
            {task.title}
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={getTaskStatus(task)} />
            {worker?.phoneNumber && (
              <button
                onClick={() => {
                  const phone = worker.phoneNumber!.replace(/\D/g, "");
                  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
                  const taskUrl = `${appUrl}/tasks/${taskId}`;
                  const text = encodeURIComponent(
                    `Hi ${worker.name}! Here is your task:\n"${task.title}"\n\n${taskUrl}`
                  );
                  window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
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
          <div>
            <div className="text-[11px] font-medium text-muted uppercase tracking-wider mb-1">Assigned to</div>
            <div className="text-[14px] text-text">{worker?.name ?? task.assignedTo}</div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted uppercase tracking-wider mb-1">Assigned by</div>
            <div className="text-[14px] text-text">{task.assignedBy}</div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted uppercase tracking-wider mb-1">Location</div>
            <div className="text-[14px] text-text">{task.location}</div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted uppercase tracking-wider mb-1">Duration</div>
            <div className="text-[14px] text-text">{durLabel}</div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted uppercase tracking-wider mb-1">Created</div>
            <div className="text-[14px] text-text">{task.createdAt ? formatDate(task.createdAt) : "–"}</div>
          </div>
          {task.updatedAt && (
            <div>
              <div className="text-[11px] font-medium text-muted uppercase tracking-wider mb-1">Last updated</div>
              <div className="text-[14px] text-text">{formatDate(task.updatedAt)}</div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-4">
          <div className="text-[11px] font-medium text-muted uppercase tracking-wider mb-2">Description</div>
          <div
            className="text-[13px] text-muted leading-relaxed px-3 py-2.5 rounded-lg"
            style={{ background: "rgba(0,0,0,0.04)", border: "0.5px solid rgba(0,0,0,0.08)" }}
          >
            {task.description || "No description provided."}
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
              {/* Image */}
              <div className="w-full" style={{ aspectRatio: "16/9" }}>
                <img
                  src={attachments[sliderIndex]}
                  alt={`Attachment ${sliderIndex + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Arrows */}
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
                </>
              )}

              {/* Dots */}
              {attachments.length > 1 && (
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
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
