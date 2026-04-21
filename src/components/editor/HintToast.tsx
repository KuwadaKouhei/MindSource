"use client";

import { Glyph } from "@/components/ui/primitives/Glyph";

type Props = {
  visible: boolean;
};

export function HintToast({ visible }: Props) {
  if (!visible) return null;
  return (
    <div
      className="clip-notch-sm"
      style={{
        position: "absolute",
        top: 14,
        right: 14,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        background: "rgba(10, 16, 32, 0.92)",
        border: "1px solid var(--cyan-deep)",
        color: "var(--text)",
        fontSize: 12,
        pointerEvents: "none",
        boxShadow: "0 0 18px rgba(79, 209, 255, 0.18)",
      }}
    >
      <span style={{ color: "var(--amber)" }}>
        <Glyph name="info" size={14} />
      </span>
      <span
        className="mono"
        style={{ fontSize: 10, letterSpacing: 1.2, color: "var(--amber)" }}
      >
        HINT
      </span>
      <span style={{ color: "var(--line2)" }}>/</span>
      <span style={{ color: "var(--muted2)" }}>
        ノードを選択すると編集パネルが表示されます
      </span>
    </div>
  );
}
