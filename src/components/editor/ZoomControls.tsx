"use client";

import { useReactFlow, useStore } from "@xyflow/react";
import { Glyph } from "@/components/ui/primitives/Glyph";

export function ZoomControls() {
  const rf = useReactFlow();
  const zoom = useStore((s) => s.transform[2]);
  const pct = Math.round(zoom * 100);

  const btn: React.CSSProperties = {
    width: 32,
    height: 30,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    color: "var(--muted2)",
    border: "none",
    borderRight: "1px solid var(--line)",
    cursor: "pointer",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
  };

  return (
    <div
      className="clip-notch-sm mono"
      style={{
        position: "absolute",
        left: 14,
        bottom: 14,
        zIndex: 8,
        display: "inline-flex",
        alignItems: "center",
        background: "rgba(10, 16, 32, 0.92)",
        border: "1px solid var(--line2)",
        height: 30,
        overflow: "hidden",
      }}
    >
      <button style={btn} onClick={() => rf.zoomIn()} aria-label="zoom in">
        +
      </button>
      <span
        style={{
          padding: "0 10px",
          color: "var(--cyan)",
          fontSize: 11,
          letterSpacing: 0.6,
          borderRight: "1px solid var(--line)",
          minWidth: 48,
          textAlign: "center",
        }}
      >
        {pct}%
      </span>
      <button style={btn} onClick={() => rf.zoomOut()} aria-label="zoom out">
        −
      </button>
      <button
        style={{ ...btn, borderRight: "none", width: 36 }}
        onClick={() => rf.fitView({ padding: 0.12, duration: 300 })}
        aria-label="fit"
        title="fit"
      >
        <Glyph name="fit" size={14} />
      </button>
    </div>
  );
}
