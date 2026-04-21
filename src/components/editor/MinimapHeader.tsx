import { LiveStatus } from "@/components/ui/primitives/LiveStatus";

export function MinimapHeader() {
  return (
    <div
      className="mono"
      style={{
        position: "absolute",
        right: 16,
        bottom: 138,
        zIndex: 9,
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "3px 10px",
        background: "rgba(10, 16, 32, 0.92)",
        border: "1px solid var(--line2)",
        fontSize: 10,
        letterSpacing: 1.2,
        color: "var(--muted2)",
        textTransform: "uppercase",
        pointerEvents: "none",
        clipPath:
          "polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)",
      }}
    >
      MINIMAP
      <span style={{ color: "var(--line2)" }}>/</span>
      <LiveStatus />
    </div>
  );
}
