"use client";

import { useEffect, useState } from "react";
import { useReactFlow, useStore, type ReactFlowState } from "@xyflow/react";
import type { WebsocketProvider } from "y-websocket";

type Cursor = { clientId: number; x: number; y: number; color: string; name: string };

type Props = { provider: WebsocketProvider | null };

const transformSelector = (s: ReactFlowState) => s.transform;

export function RemoteCursors({ provider }: Props) {
  const rf = useReactFlow();
  const transform = useStore(transformSelector);
  const [cursors, setCursors] = useState<Cursor[]>([]);

  // Broadcast our pointer in world coordinates (pane coordinates, not DOM).
  useEffect(() => {
    if (!provider) return;
    const pane = document.querySelector<HTMLElement>(".react-flow");
    if (!pane) return;

    let lastSent = 0;
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastSent < 40) return;
      lastSent = now;
      const pos = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      provider.awareness.setLocalStateField("cursor", pos);
    };
    const onLeave = () => provider.awareness.setLocalStateField("cursor", null);
    pane.addEventListener("pointermove", onMove);
    pane.addEventListener("pointerleave", onLeave);
    return () => {
      pane.removeEventListener("pointermove", onMove);
      pane.removeEventListener("pointerleave", onLeave);
    };
  }, [provider, rf]);

  // Read other clients' cursors.
  useEffect(() => {
    if (!provider) return;
    const awareness = provider.awareness;
    const recompute = () => {
      const list: Cursor[] = [];
      awareness.getStates().forEach((state, clientId) => {
        if (clientId === awareness.clientID) return;
        const c = (state as { cursor?: { x: number; y: number } | null }).cursor;
        const u = (state as { user?: { color?: string; name?: string } }).user;
        if (!c) return;
        list.push({
          clientId,
          x: c.x,
          y: c.y,
          color: u?.color ?? "#7c9cff",
          name: u?.name ?? "ゲスト",
        });
      });
      setCursors(list);
    };
    awareness.on("change", recompute);
    recompute();
    return () => {
      awareness.off("change", recompute);
    };
  }, [provider]);

  if (!provider) return null;

  const [tx, ty, scale] = transform;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {cursors.map((c) => {
        const sx = c.x * scale + tx;
        const sy = c.y * scale + ty;
        return (
          <div
            key={c.clientId}
            style={{
              position: "absolute",
              left: sx,
              top: sy,
              transform: "translate(-2px, -2px)",
              transition: "left 60ms linear, top 60ms linear",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2 L2 14 L6 10 L9 16 L11 15 L8 9 L14 9 Z" fill={c.color} stroke="#0b0d12" strokeWidth="1" />
            </svg>
            <div
              style={{
                marginTop: 2,
                background: c.color,
                color: "#0b0d12",
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 6,
                whiteSpace: "nowrap",
              }}
            >
              {c.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
