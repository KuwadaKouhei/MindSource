"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ToastKind = "info" | "success" | "error" | "warning";

type Toast = {
  id: string;
  kind: ToastKind;
  title?: string;
  message: string;
  durationMs: number;
};

type ToastInput = Omit<Toast, "id" | "durationMs"> & { durationMs?: number };

type ToastCtx = {
  show: (t: ToastInput) => string;
  dismiss: (id: string) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Allow calling outside the provider (e.g. on SSR); no-op.
    return { show: () => "", dismiss: () => {} } as ToastCtx;
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((t: ToastInput) => {
    const id = Math.random().toString(36).slice(2, 10);
    const full: Toast = {
      id,
      durationMs: t.durationMs ?? (t.kind === "error" ? 6000 : 3500),
      ...t,
    };
    setToasts((prev) => [...prev, full]);
    return id;
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      window.setTimeout(() => dismiss(t.id), t.durationMs),
    );
    return () => {
      timers.forEach((h) => window.clearTimeout(h));
    };
  }, [toasts, dismiss]);

  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 200,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            onClick={() => dismiss(t.id)}
            className="clip-notch-sm"
            style={{
              pointerEvents: "auto",
              maxWidth: 360,
              background: "rgba(10,16,32,0.94)",
              border: `1px solid ${colorFor(t.kind)}`,
              borderLeftWidth: 2,
              padding: "10px 14px",
              color: "var(--text)",
              fontSize: 13,
              cursor: "pointer",
              filter: `drop-shadow(0 0 8px ${colorFor(t.kind)}55)`,
            }}
          >
            {t.title && (
              <div
                className="mono"
                style={{
                  fontWeight: 700,
                  marginBottom: 3,
                  color: colorFor(t.kind),
                  fontSize: 11,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                <span>● </span>
                {t.title}
              </div>
            )}
            <div>{t.message}</div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

function colorFor(kind: ToastKind): string {
  switch (kind) {
    case "success": return "var(--green)";
    case "error":   return "var(--pink)";
    case "warning": return "var(--amber)";
    default:        return "var(--cyan)";
  }
}
