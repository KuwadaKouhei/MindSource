"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "tb" | "tb-active" | "tb-icon" | "danger";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  variant?: Variant;
  children?: ReactNode;
  className?: string;
};

const base: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  fontFamily: "var(--font-noto)",
  cursor: "pointer",
  lineHeight: 1.2,
  transition: "background 0.15s, color 0.15s, border-color 0.15s, transform 0.1s",
  whiteSpace: "nowrap",
};

function style(v: Variant): React.CSSProperties {
  switch (v) {
    case "primary":
      return {
        ...base,
        padding: "11px 18px",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: 0.4,
        color: "#021018",
        background:
          "linear-gradient(135deg, var(--cyan) 0%, #7be3ff 60%, var(--cyan) 100%)",
        border: "1px solid var(--cyan)",
        boxShadow: "0 0 12px rgba(79,209,255,0.45)",
      };
    case "ghost":
      return {
        ...base,
        padding: "11px 18px",
        fontSize: 13,
        fontWeight: 500,
        color: "var(--text)",
        background: "transparent",
        border: "1px solid var(--line2)",
      };
    case "tb":
      return {
        ...base,
        padding: "7px 11px",
        fontSize: 12,
        color: "var(--text)",
        background: "var(--bg3)",
        border: "1px solid var(--line2)",
      };
    case "tb-active":
      return {
        ...base,
        padding: "7px 11px",
        fontSize: 12,
        fontWeight: 700,
        color: "#021018",
        background: "linear-gradient(135deg, var(--cyan), #7be3ff)",
        border: "1px solid var(--cyan)",
        boxShadow: "0 0 8px rgba(79,209,255,0.5)",
      };
    case "tb-icon":
      return {
        ...base,
        padding: 0,
        width: 30,
        height: 28,
        fontSize: 12,
        color: "var(--muted2)",
        background: "var(--bg3)",
        border: "1px solid var(--line2)",
      };
    case "danger":
      return {
        ...base,
        padding: "7px 11px",
        fontSize: 12,
        color: "var(--pink)",
        background: "transparent",
        border: "1px solid var(--line2)",
      };
  }
}

export function Button({
  variant = "tb",
  children,
  className = "",
  style: st,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={`clip-notch-sm ${className}`.trim()}
      style={{ ...style(variant), ...(st ?? {}) }}
    >
      {children}
    </button>
  );
}
