"use client";

import { useEffect } from "react";
import Link from "next/link";
import { use } from "react";
import { IconArrowLeft, IconClipboardText } from "@tabler/icons-react";
import { useTasksStore } from "@/store/useTasksStore";
import { useWorkersStore } from "@/store/useWorkersStore";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatDate } from "@/lib/utils";

export default function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = use(params);
  const { tasks, subscribe } = useTasksStore();
  const { workers, subscribe: subWorkers } = useWorkersStore();

  useEffect(() => {
    const u1 = subscribe();
    const u2 = subWorkers();
    return () => { u1(); u2(); };
  }, [subscribe, subWorkers]);

  const task = tasks.find((t) => t.id === taskId);
  const worker = workers.find((w) => w.id === task?.assignedTo);

  if (!task) {
    return (
      <div className="flex flex-col gap-3">
        <Link href="/tasks" className="flex items-center gap-1.5 text-[12px] text-acc-txt">
          <IconArrowLeft size={14} />
          Back to task tracker
        </Link>
        <div className="text-[12px] text-muted text-center py-10">Task not found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Link href="/tasks" className="flex items-center gap-1.5 text-[12px] text-acc-txt">
        <IconArrowLeft size={14} />
        Back to task tracker
      </Link>

      <div
        className="rounded-xl px-[15px] py-[13px]"
        style={{ background: "var(--color-surface)", border: "0.5px solid rgba(0,0,0,0.10)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-text">
            <IconClipboardText size={14} color="var(--color-acc)" />
            {task.title}
          </div>
          <StatusBadge status={task.status} />
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-[10px] font-medium text-muted uppercase tracking-wider mb-1">Assigned to</div>
            <div className="text-[13px] text-text">{worker?.name ?? task.assignedTo}</div>
          </div>
          <div>
            <div className="text-[10px] font-medium text-muted uppercase tracking-wider mb-1">Assigned by</div>
            <div className="text-[13px] text-text">{task.assignedBy}</div>
          </div>
          <div>
            <div className="text-[10px] font-medium text-muted uppercase tracking-wider mb-1">Location</div>
            <div className="text-[13px] text-text">{task.location}</div>
          </div>
          <div>
            <div className="text-[10px] font-medium text-muted uppercase tracking-wider mb-1">Duration</div>
            <div className="text-[13px] text-text">{task.duration ? `${task.duration}h` : "–"}</div>
          </div>
          <div>
            <div className="text-[10px] font-medium text-muted uppercase tracking-wider mb-1">Created</div>
            <div className="text-[13px] text-text">{task.createdAt ? formatDate(task.createdAt) : "–"}</div>
          </div>
          {task.updatedAt && (
            <div>
              <div className="text-[10px] font-medium text-muted uppercase tracking-wider mb-1">Last updated</div>
              <div className="text-[13px] text-text">{formatDate(task.updatedAt)}</div>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="text-[10px] font-medium text-muted uppercase tracking-wider mb-2">Progress</div>
          <ProgressBar value={task.progress} width="100%" height={7} />
        </div>

        {/* Description */}
        <div>
          <div className="text-[10px] font-medium text-muted uppercase tracking-wider mb-2">Description</div>
          <div
            className="text-[12px] text-muted leading-relaxed px-3 py-2.5 rounded-lg"
            style={{ background: "rgba(0,0,0,0.04)", border: "0.5px solid rgba(0,0,0,0.08)" }}
          >
            {task.description || "No description provided."}
          </div>
        </div>
      </div>
    </div>
  );
}
