"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useWorkersStore } from "@/store/useWorkersStore";
import { useTasksStore } from "@/store/useTasksStore";
import { useReportsStore } from "@/store/useReportsStore";
import { getAttendanceStatus } from "@/lib/utils";
import { IconSend } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";

function buildContext() {
  const workers = useWorkersStore.getState().workers;
  const tasks = useTasksStore.getState().tasks;
  const analysis = useReportsStore.getState().analysis;

  const presentCount = workers.filter((w) => getAttendanceStatus(w.checkIn) !== "Absent").length;
  const absentCount = workers.filter((w) => getAttendanceStatus(w.checkIn) === "Absent").length;
  const lateCount = workers.filter((w) => getAttendanceStatus(w.checkIn) === "Late").length;
  const activeTasks = tasks.filter((t) => t.status !== "Completed").length;
  const overdueTasks = tasks.filter((t) => t.status === "Delayed" || t.status === "Urgent").length;
  const totalEmptyRooms = analysis?.hotels.reduce((s, h) => s + h.emptyRooms, 0) ?? 0;
  const openComplaints = analysis?.hotels.reduce((s, h) => s + h.complaints.length, 0) ?? 0;

  return { presentCount, absentCount, lateCount, activeTasks, overdueTasks, totalEmptyRooms, openComplaints };
}

export function AiChatPanel() {
  const [input, setInput] = useState("");

  const { messages, status, sendMessage } = useChat<UIMessage>({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages, body }) => ({
        body: { messages, ...body, context: buildContext() },
      }),
    }),
    messages: [
      {
        id: "init",
        role: "assistant" as const,
        parts: [{ type: "text" as const, text: "Good morning! I'm your AI operations assistant. Ask me about attendance, rooms, complaints, or tasks." }],
        metadata: {},
      },
    ] satisfies UIMessage[],
  });

  const msgsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status === "streaming") return;
    sendMessage({ text: input.trim() });
    setInput("");
  };

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl"
      style={{ background: "var(--color-surface)", border: "0.5px solid rgba(0,0,0,0.10)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-1.5 px-3 py-2.5"
        style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}
      >
        <span
          className="w-[7px] h-[7px] rounded-full"
          style={{ background: "#639922", animation: "pulse 2s infinite" }}
        />
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
        <span className="text-[12px] font-medium text-text">AI Assistant</span>
        <span className="ml-auto text-[10px] text-muted">claude-sonnet-4-6</span>
      </div>

      {/* Messages */}
      <div
        ref={msgsRef}
        className="flex-1 p-2.5 overflow-y-auto flex flex-col gap-1.5"
        style={{ minHeight: 100, maxHeight: 160 }}
      >
        {messages.map((m) => {
          const text = m.parts
            .filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join("");
          return (
            <div
              key={m.id}
              className={`max-w-[88%] px-2.5 py-1.5 rounded-xl text-[11px] leading-relaxed ${
                m.role === "user" ? "self-end rounded-br-sm" : "self-start rounded-bl-sm"
              }`}
              style={{
                background: m.role === "user" ? "var(--color-acc)" : "rgba(0,0,0,0.05)",
                color: m.role === "user" ? "#fff" : "var(--color-text)",
              }}
            >
              {text}
            </div>
          );
        })}
        {status === "streaming" && (
          <div
            className="self-start max-w-[88%] px-2.5 py-1.5 rounded-xl rounded-bl-sm text-[11px]"
            style={{ background: "rgba(0,0,0,0.05)", color: "var(--color-muted)" }}
          >
            Thinking…
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-1.5 px-2 py-1.5"
        style={{ borderTop: "0.5px solid rgba(0,0,0,0.10)" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your team…"
          className="flex-1 text-[11px] px-2.5 py-1 rounded-full outline-none"
          style={{
            border: "0.5px solid rgba(0,0,0,0.10)",
            background: "rgba(0,0,0,0.04)",
            color: "var(--color-text)",
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || status === "streaming"}
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-50"
          style={{ background: "var(--color-acc)" }}
        >
          <IconSend size={12} color="#fff" />
        </button>
      </form>
    </div>
  );
}
