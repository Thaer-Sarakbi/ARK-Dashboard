"use client";

import { useState } from "react";
import { IconClipboardPlus, IconCheck } from "@tabler/icons-react";
import { Modal } from "@/components/ui/Modal";
import { useTasksStore } from "@/store/useTasksStore";
import { useWorkersStore } from "@/store/useWorkersStore";

const ASSIGNED_BY = "Surendran Balan";
const ASSIGNED_BY_ID = "TN7uEpCUmZRStizVfME1vvqx3az2";

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AssignTaskModal({ isOpen, onClose }: AssignTaskModalProps) {
  const { addTask } = useTasksStore();
  const workers = useWorkersStore((s) => s.workers);

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
      const taskId = await addTask(
        {
          title: title.trim(),
          description: description.trim(),
          assignedTo: selectedWorker?.name ?? assigneeId,
          assignedToId: assigneeId,
          assignedBy: ASSIGNED_BY,
          assignedById: ASSIGNED_BY_ID,
          location: location.trim(),
          duration: duration ? parseInt(duration, 10) : 0,
        },
        assigneeId
      );

      const phone = (selectedWorker?.phoneNumber ?? "").replace(/\D/g, "");
      if (phone) {
        const deepLink = `https://zxcom.app.link/gCM90m5KQ3b?taskId=${taskId}&assignedToId=${assigneeId}`;
        const text = encodeURIComponent(
          `Hi ${selectedWorker?.name ?? ""}! You have a new task assigned:\n"${title.trim()}"\n\n${deepLink}`
        );
        window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
      }

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
    fontSize: 13,
    padding: "7px 10px",
    width: "100%",
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-1.5">
          <IconClipboardPlus size={15} color="var(--color-acc)" />
          Assign new task
        </span>
      }
    >
      <div className="px-4 py-4 flex flex-col gap-3">
        <div>
          <label className="block text-[12px] font-medium text-muted mb-1">Task title</label>
          <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Room inspection – Floor 2" />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-muted mb-1">Description</label>
          <textarea
            style={{ ...inputStyle, resize: "none", height: 64 }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the task in detail…"
          />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[12px] font-medium text-muted mb-1">Assign to</label>
            <select style={inputStyle} value={assigneeId} onChange={(e) => handleWorkerChange(e.target.value)}>
              <option value="">Select worker…</option>
              {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-muted mb-1">Assigned by</label>
            <input style={{ ...inputStyle, opacity: 0.7 }} value={ASSIGNED_BY} readOnly />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[12px] font-medium text-muted mb-1">Location / hotel</label>
            <input
              style={inputStyle}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={selectedWorker?.placeName ?? "Hotel name"}
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-muted mb-1">Duration (days)</label>
            <input
              style={inputStyle}
              type="number"
              min="1"
              max="365"
              step="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 3"
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
          className="text-[13px] px-3.5 py-1.5 rounded-lg text-text transition-colors hover:bg-canvas"
          style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-1 text-[13px] px-3.5 py-1.5 rounded-lg text-white disabled:opacity-60"
          style={{ background: "var(--color-acc)" }}
        >
          <IconCheck size={13} />
          {submitting ? "Assigning…" : "Assign task"}
        </button>
      </div>
    </Modal>
  );
}
