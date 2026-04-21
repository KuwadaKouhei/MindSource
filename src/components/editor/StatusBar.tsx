"use client";

import { useEffect, useState } from "react";

type Props = {
  nodesCount: number;
  edgesCount: number;
  depth: number;
  modelName?: string;
  threshold?: number;
  selectedLabel?: string | null;
  saveState?: "idle" | "saving" | "saved" | "error";
  providerReady?: boolean;
  enableCollab?: boolean;
};

export function StatusBar({
  nodesCount,
  edgesCount,
  depth,
  modelName = "chiVe-1.2",
  threshold = 0.42,
  selectedLabel,
  saveState = "idle",
  providerReady = false,
  enableCollab = false,
}: Props) {
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (saveState === "saved") setLastSavedAt(Date.now());
  }, [saveState]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => (n + 1) % 1000), 1000);
    return () => window.clearInterval(id);
  }, []);

  const savedLabel = (() => {
    if (saveState === "saving") return "saving…";
    if (saveState === "error") return "error";
    if (!lastSavedAt) return "—";
    const s = Math.max(0, Math.floor((Date.now() - lastSavedAt) / 1000));
    if (s < 2) return "just now";
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  })();

  const connColor = !enableCollab
    ? "var(--muted)"
    : providerReady
      ? "var(--green)"
      : "var(--amber)";
  const connLabel = !enableCollab
    ? "local"
    : providerReady
      ? "yjs · synced"
      : "yjs · connecting…";

  return (
    <div
      className="mono"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        height: 28,
        padding: "0 14px",
        fontSize: 10.5,
        letterSpacing: 0.6,
        color: "var(--muted2)",
        background: "var(--bg2)",
        borderTop: "1px solid var(--line)",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <Field label="CONN">
        <span style={{ color: connColor }}>●</span>{" "}
        <span style={{ color: "var(--text)" }}>{connLabel}</span>
      </Field>
      <Sep />
      <Field label="NODES">{nodesCount}</Field>
      <Sep />
      <Field label="EDGES">{edgesCount}</Field>
      <Sep />
      <Field label="DEPTH">{depth}</Field>
      <Sep />
      <Field label="MODEL">{modelName}</Field>
      <Sep />
      <Field label="THRESH">{threshold.toFixed(2)}</Field>
      <div style={{ flex: 1 }} />
      <Field label="SELECTED">
        <span style={{ color: selectedLabel ? "var(--cyan)" : "var(--muted)" }}>
          {selectedLabel || "—"}
        </span>
      </Field>
      <Sep />
      <Field label="SAVED">
        <span style={{ color: saveState === "error" ? "var(--pink)" : "var(--text)" }}>
          {savedLabel}
        </span>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span style={{ whiteSpace: "nowrap" }}>
      <span style={{ color: "var(--muted)", letterSpacing: 1 }}>{label}:</span>{" "}
      <span style={{ color: "var(--text)" }}>{children}</span>
    </span>
  );
}

function Sep() {
  return <span style={{ color: "var(--line2)" }}>·</span>;
}
