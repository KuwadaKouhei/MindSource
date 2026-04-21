type Props = {
  size?: "sm" | "md";
};

export function Logo({ size = "md" }: Props) {
  const s = size === "sm" ? 22 : 28;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 32 32"
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden
    >
      <g style={{ transformOrigin: "16px 16px", animation: "rotate 12s linear infinite" }}>
        <circle
          cx="16"
          cy="16"
          r="13"
          fill="none"
          stroke="var(--cyan)"
          strokeWidth="1.2"
          strokeDasharray="3 4"
          opacity="0.9"
        />
      </g>
      <circle
        cx="16"
        cy="16"
        r="7"
        fill="none"
        stroke="var(--cyan)"
        strokeWidth="1.4"
        opacity="0.95"
      />
      <circle cx="16" cy="16" r="2.2" fill="var(--cyan)" />
    </svg>
  );
}
