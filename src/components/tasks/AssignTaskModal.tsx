"use client";

import { useState } from "react";
import { IconClipboardPlus, IconCheck } from "@tabler/icons-react";
import { Modal } from "@/components/ui/Modal";
import { useTasksStore } from "@/store/useTasksStore";
import { useWorkersStore } from "@/store/useWorkersStore";
import { useUserStore } from "@/store/useUserStore";

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AssignTaskModal({ isOpen, onClose }: AssignTaskModalProps) {
  const { addTask } = useTasksStore();
  const workers = useWorkersStore((s) => s.workers);
  const profile = useUserStore((s) => s.profile);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedWorker = workers.find((w) => w.id === assigneeId);

  const handleWorkerChange = (id: string) => {
    setAssigneeId(id);
    const w = workers.find((w) => w.id === id);
    if (w) setLocation(w.placeName);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !assigneeId || !location.trim()) {
      alert("Please fill in title, worker, and location.");
      return;
    }
    setSubmitting(true);
    try {
      await addTask(
        {
          title: title.trim(),
          description: description.trim(),
          assignedTo: assigneeId,
          assignedBy: profile?.name ?? "Admin",
          location: location.trim(),
          duration: duration ? parseFloat(duration) : 0,
        },
        assigneeId
      );
      setTitle(""); setDescription(""); setAssigneeId(""); setLocation(""); setDuration("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    border: "0.5px solid rgba(0,0,0,0.12)",
    borderRadius: 7,
    background: "rgba(0,0,0,0.04)",
    color: "var(--color-text)",
    fontFamily: "inherit",
    outline: "none",
    fontSize: 12,
    padding: "7px 10px",
    width: "100%",
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-1.5">
          <IconClipboardPlus size={14} color="var(--color-acc)" />
          Assign new task
        </span>
      }
    >
      <div className="px-4 py-4 flex flex-col gap-3">
        <div>
          <label className="block text-[11px] font-medium text-muted mb-1">Task title</label>
          <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Room inspection – Floor 2" />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-muted mb-1">Description</label>
          <textarea
            style={{ ...inputStyle, resize: "none", height: 64 }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the task in detail…"
          />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-medium text-muted mb-1">Assign to</label>
            <select style={inputStyle} value={assigneeId} onChange={(e) => handleWorkerChange(e.target.value)}>
              <option value="">Select worker…</option>
              {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted mb-1">Assigned by</label>
            <input style={{ ...inputStyle, opacity: 0.7 }} value={profile?.name ?? "Admin"} readOnly />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-medium text-muted mb-1">Location / hotel</label>
            <input
              style={inputStyle}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={selectedWorker?.placeName ?? "Hotel name"}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted mb-1">Duration (hours)</label>
            <input
              style={inputStyle}
              type="number"
              min="0.5"
              max="12"
              step="0.5"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 2"
            />
          </div>
        </div>
      </div>
      <div
        className="flex justify-end gap-2 px-4 py-3"
        style={{ borderTop: "0.5px solid rgba(0,0,0,0.10)" }}
      >
        <button
          onClick={onClose}
          className="text-[12px] px-3.5 py-1.5 rounded-lg text-text transition-colors hover:bg-canvas"
          style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-1 text-[12px] px-3.5 py-1.5 rounded-lg text-white disabled:opacity-60"
          style={{ background: "var(--color-acc)" }}
        >
          <IconCheck size={12} />
          {submitting ? "Assigning…" : "Assign task"}
        </button>
      </div>
    </Modal>
  );
}
