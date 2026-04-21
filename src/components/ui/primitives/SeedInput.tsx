"use client";

import { useState, type FormEvent } from "react";
import { Glyph } from "./Glyph";

type Props = {
  size?: "hero" | "toolbar";
  value?: string;
  onChange?: (v: string) => void;
  onSubmit: (v: string) => void;
  loading?: boolean;
  placeholder?: string;
  submitLabel?: string;
};

export function SeedInput({
  size = "hero",
  value: controlled,
  onChange,
  onSubmit,
  loading = false,
  placeholder = "起点ワードを入力…",
  submitLabel,
}: Props) {
  const [uncontrolled, setUncontrolled] = useState("");
  const value = controlled ?? uncontrolled;
  const set = (v: string) => {
    if (onChange) onChange(v);
    else setUncontrolled(v);
  };

  const hero = size === "hero";
  const height = hero ? 56 : 30;
  const fontSize = hero ? 18 : 12;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const w = value.trim();
    if (w) onSubmit(w);
  };

  return (
    <form
      onSubmit={submit}
      className={hero ? "corners" : ""}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "stretch",
        gap: 0,
        background: "var(--bg2)",
        border: `${hero ? 1.5 : 1}px solid var(--cyan)`,
        height,
        padding: hero ? 4 : 2,
        clipPath: hero
          ? "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)"
          : "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)",
        animation: hero ? "glowpulse 3s ease-in-out infinite" : undefined,
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: hero ? 40 : 24,
          fontFamily: "var(--font-mono)",
          fontSize: hero ? 20 : 13,
          color: "var(--cyan)",
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        $
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          minWidth: 0,
          background: "transparent",
          border: "none",
          outline: "none",
          color: "var(--text)",
          fontSize,
          fontFamily: "var(--font-noto)",
          padding: hero ? "0 12px" : "0 8px",
        }}
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="clip-notch-sm"
        style={{
          padding: hero ? "0 24px" : "0 12px",
          fontSize: hero ? 13 : 11,
          fontWeight: 700,
          letterSpacing: 0.4,
          color: "#021018",
          background:
            loading || !value.trim()
              ? "var(--cyan-dim)"
              : "linear-gradient(135deg, var(--cyan) 0%, #7be3ff 60%, var(--cyan) 100%)",
          border: "none",
          cursor: loading || !value.trim() ? "not-allowed" : "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          whiteSpace: "nowrap",
        }}
      >
        <Glyph name="sparkles" size={hero ? 16 : 13} />
        {submitLabel ?? (loading ? "生成中…" : hero ? "自動生成 (cascade)" : "生成")}
      </button>
    </form>
  );
}
