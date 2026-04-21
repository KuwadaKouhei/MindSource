export function Footer() {
  return (
    <footer
      className="mono"
      style={{
        position: "relative",
        zIndex: 2,
        borderTop: "1px solid var(--line)",
        padding: "22px 28px",
        display: "flex",
        alignItems: "center",
        gap: 18,
        fontSize: 11,
        color: "var(--muted)",
        letterSpacing: 0.6,
        flexWrap: "wrap",
      }}
    >
      <span>© 2026 MindSource</span>
      <span style={{ color: "var(--line2)" }}>·</span>
      <span>
        STATUS: <span style={{ color: "var(--green)" }}>●</span>{" "}
        <span style={{ color: "var(--text)" }}>ONLINE</span>
      </span>
      <div style={{ flex: 1 }} />
      <a href="#" style={{ color: "var(--muted2)" }}>
        Docs
      </a>
      <a href="#" style={{ color: "var(--muted2)" }}>
        GitHub
      </a>
      <a href="#" style={{ color: "var(--muted2)" }}>
        Privacy
      </a>
      <a href="#" style={{ color: "var(--muted2)" }}>
        Contact
      </a>
    </footer>
  );
}
