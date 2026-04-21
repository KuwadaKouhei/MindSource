import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  variant?: "cyan" | "amber";
  className?: string;
};

export function Tag({ children, variant = "cyan", className = "" }: Props) {
  const cls = variant === "amber" ? "tag amber" : "tag";
  return <span className={`${cls} ${className}`.trim()}>{children}</span>;
}
