"use client";

import { IconX } from "@tabler/icons-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(0,0,0,0.38)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[460px] rounded-xl"
        style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.10)" }}
      >
        <div
          className="flex items-center justify-between px-4 py-3.5"
          style={{ borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}
        >
          <div className="text-[13px] font-medium text-text">{title}</div>
          <button
            onClick={onClose}
            className="text-muted hover:text-text transition-colors leading-none"
            aria-label="Close"
          >
            <IconX size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
