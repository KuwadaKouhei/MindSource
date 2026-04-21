import type { ReactNode } from "react";
import { CornerMarks } from "./CornerMarks";

type Props = {
  children: ReactNode;
  corners?: boolean;
  tag?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: "div" | "section" | "article";
};

export function NotchedPanel({
  children,
  corners = false,
  tag,
  className = "",
  style,
  as: As = "section",
}: Props) {
  return (
    <As
      className={`clip-notch corners ${className}`.trim()}
      style={{
        position: "relative",
        background: "var(--bg2)",
        border: "1px solid var(--line)",
        ...style,
      }}
    >
      {corners && <CornerMarks />}
      {tag && <div style={{ marginBottom: 12 }}>{tag}</div>}
      {children}
    </As>
  );
}
