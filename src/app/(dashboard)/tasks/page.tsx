"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconClipboardList,
  IconCircleCheck,
  IconClock,
  IconAlertTriangle,
  IconPlus,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useTasksStore } from "@/store/useTasksStore";
import { useWorkersStore } from "@/store/useWorkersStore";
import { KpiCard } from "@/components/ui/KpiCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Avatar } from "@/components/ui/Avatar";
import { AssignTaskModal } from "@/components/tasks/AssignTaskModal";
import { todayKey } from "@/lib/utils";

export default function TasksPage() {
  const { tasks, loading, subscribe } = useTasksStore();
  const { workers, subscribe: subWorkers } = useWorkersStore();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const u1 = subscribe();
    const u2 = subWorkers();
    return () => { u1(); u2(); };
  }, [subscribe, subWorkers]);

  const today = todayKey();
  const activeTasks = tasks.filter((t) => t.status !== "Completed");
  const completedToday = tasks.filter((t) => {
    if (t.status !== "Completed") return false;
    if (!t.updatedAt) return false;
    const d = t.updatedAt.toDate();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}` === today;
  });
  const overdueTasks = tasks.filter((t) => t.status === "Delayed" || t.status === "Urgent");
  const avgDuration = tasks.length
    ? (tasks.reduce((s, t) => s + (t.duration ?? 0), 0) / tasks.length).toFixed(1)
    : "0";

  const workerMap = Object.fromEntries(workers.map((w) => [w.id, w]));

  return (
    <div className="flex flex-col gap-3">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <KpiCard
          label="Active tasks"
          value={activeTasks.length}
          icon={<IconClipboardList size={12} color="var(--color-acc)" />}
          sub={<span className="text-muted">across {new Set(activeTasks.map((t) => t.assignedTo)).size} workers</span>}
        />
        <KpiCard
          label="Completed today"
          value={completedToday.length}
          icon={<IconCircleCheck size={12} color="var(--color-ok)" />}
          valueClass="text-ok"
          sub={<span className="text-ok">vs yesterday</span>}
        />
        <KpiCard
          label="Avg duration"
          value={`${avgDuration}h`}
          icon={<IconClock size={12} color="var(--color-acc)" />}
          sub={<span className="text-muted">per task</span>}
        />
        <KpiCard
          label="Overdue"
          value={overdueTasks.length}
          icon={<IconAlertTriangle size={12} color="var(--color-err)" />}
          valueClass="text-err"
          sub={<span className="text-err">needs attention</span>}
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1 text-[12px] px-3.5 py-1.5 rounded-lg text-white"
          style={{ background: "var(--color-acc)" }}
        >
          <IconPlus size={12} />
          Assign task
        </button>
      </div>

      {/* Task table */}
      <div
        className="rounded-xl px-[15px] py-[13px]"
        style={{ background: "var(--color-surface)", border: "0.5px solid rgba(0,0,0,0.10)" }}
      >
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-text mb-2.5">
          <IconClipboardList size={14} color="var(--color-acc)" />
          Active tasks
        </div>

        <table className="w-full text-[11px] border-collapse" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th className="text-left text-muted font-medium pb-1.5 w-[28%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Title</th>
              <th className="text-left text-muted font-medium pb-1.5 w-[16%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Worker</th>
              <th className="text-left text-muted font-medium pb-1.5 w-[16%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Location</th>
              <th className="text-left text-muted font-medium pb-1.5 w-[10%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Duration</th>
              <th className="text-left text-muted font-medium pb-1.5 w-[18%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Progress</th>
              <th className="text-left text-muted font-medium pb-1.5 w-[12%]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="text-center text-muted py-6">Loading…</td></tr>
            )}
            {!loading && tasks.length === 0 && (
              <tr><td colSpan={6} className="text-center text-muted py-6">No tasks yet</td></tr>
            )}
            {tasks.map((task) => {
              const worker = workerMap[task.assignedTo];
              return (
                <tr
                  key={task.id}
                  className="cursor-pointer hover:bg-canvas transition-colors"
                >
                  <td className="py-1.5" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                    <Link href={`/tasks/${task.id}`} className="font-medium text-acc-txt block truncate hover:underline">
                      {task.title}
                    </Link>
                  </td>
                  <td className="py-1.5" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                    <div className="flex items-center gap-1.5">
                      {worker && <Avatar userId={worker.id} name={worker.name} size={20} />}
                      <span className="truncate">{worker?.name ?? task.assignedTo}</span>
                    </div>
                  </td>
                  <td className="py-1.5 text-muted truncate" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>{task.location}</td>
                  <td className="py-1.5 text-muted" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>{task.duration ? `${task.duration}h` : "–"}</td>
                  <td className="py-1.5" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                    <ProgressBar value={task.progress} width={70} />
                  </td>
                  <td className="py-1.5" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                    <StatusBadge status={task.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center gap-1 text-[10px] text-muted mt-2">
          <IconInfoCircle size={11} />
          Click any task title to view details
        </div>
      </div>

      <AssignTaskModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
