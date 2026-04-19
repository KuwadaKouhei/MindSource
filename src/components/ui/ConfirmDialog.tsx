"use client";

import { useEffect } from "react";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "キャンセル",
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 150,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 22,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        }}
      >
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>{title}</h2>
          <p style={{ fontSize: 13, color: "#c5cad6", marginTop: 6, lineHeight: 1.6 }}>
            {message}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={btn()}>{cancelLabel}</button>
          <button
            onClick={onConfirm}
            style={danger ? btnDanger() : btnPrimary()}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function btn(): React.CSSProperties {
  return {
    padding: "8px 14px", borderRadius: 8,
    background: "var(--surface-2)", border: "1px solid var(--border)",
    color: "var(--foreground)", cursor: "pointer", fontSize: 13,
  };
}
function btnPrimary(): React.CSSProperties {
  return {
    padding: "8px 14px", borderRadius: 8,
    background: "var(--accent)", border: "none",
    color: "#0b0d12", cursor: "pointer", fontSize: 13, fontWeight: 700,
  };
}
function btnDanger(): React.CSSProperties {
  return {
    padding: "8px 14px", borderRadius: 8,
    background: "#ff6b7a", border: "none",
    color: "#0b0d12", cursor: "pointer", fontSize: 13, fontWeight: 700,
  };
}
