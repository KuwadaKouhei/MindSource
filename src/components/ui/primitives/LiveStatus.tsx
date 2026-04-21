type Props = {
  label?: string;
  color?: "cyan" | "amber" | "green";
};

export function LiveStatus({ label = "LIVE", color = "cyan" }: Props) {
  const c =
    color === "amber" ? "var(--amber)" : color === "green" ? "var(--green)" : "var(--cyan)";
  return (
    <span
      className="mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 10,
        letterSpacing: 1.5,
        color: c,
        textTransform: "uppercase",
        animation: "flicker 4s steps(1, end) infinite",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 9999,
          background: c,
          boxShadow: `0 0 6px ${c}`,
        }}
      />
      {label}
    </span>
  );
}
