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
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 150,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="clip-notch corners"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 420,
          background: "var(--bg2)",
          border: `1px solid ${danger ? "var(--pink)" : "var(--cyan-dim)"}`,
          padding: "22px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          filter: `drop-shadow(0 0 18px ${danger ? "rgba(255,107,157,0.25)" : "rgba(79,209,255,0.25)"})`,
        }}
      >
        <div>
          <div
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: 2,
              color: danger ? "var(--pink)" : "var(--cyan)",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            ● {danger ? "CONFIRM_DESTRUCTIVE" : "CONFIRM"}
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>{title}</h2>
          <p style={{ fontSize: 13, color: "var(--muted2)", marginTop: 8, lineHeight: 1.65 }}>
            {message}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} className="clip-notch-sm" style={btnGhost}>
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="clip-notch-sm"
            style={danger ? btnDanger : btnPrimary}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const btnGhost: React.CSSProperties = {
  padding: "8px 16px",
  background: "transparent",
  border: "1px solid var(--line2)",
  color: "var(--text)",
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "var(--font-noto)",
};
const btnPrimary: React.CSSProperties = {
  padding: "8px 16px",
  background: "linear-gradient(135deg, var(--cyan), #7be3ff)",
  border: "1px solid var(--cyan)",
  color: "#021018",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
  fontFamily: "var(--font-noto)",
  boxShadow: "0 0 10px rgba(79,209,255,0.5)",
};
const btnDanger: React.CSSProperties = {
  padding: "8px 16px",
  background: "var(--pink)",
  border: "1px solid var(--pink)",
  color: "#1a0510",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
  fontFamily: "var(--font-noto)",
  boxShadow: "0 0 10px rgba(255,107,157,0.45)",
};
