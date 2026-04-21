import Link from "next/link";
import { getSession } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/primitives/Logo";

type Props = {
  variant?: "full" | "slim";
};

export async function HomeNav({ variant = "full" }: Props) {
  const user = await getSession();
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "12px 28px",
        height: 60,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        background: "rgba(5, 8, 15, 0.78)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Logo size="sm" />
        <span
          className="mono cursor-blink"
          style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", letterSpacing: 1.2 }}
        >
          MINDSOURCE
        </span>
        {variant === "full" && (
          <span
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--muted)",
              letterSpacing: 1,
              marginLeft: 6,
            }}
          >
            v0.4.2 <span style={{ color: "var(--cyan-dim)" }}>//</span> AI-ASSISTED NETWORK SYNTH
          </span>
        )}
      </Link>

      <div style={{ flex: 1 }} />

      <nav
        className="mono"
        style={{ display: "flex", gap: 18, fontSize: 11, letterSpacing: 1, color: "var(--muted2)" }}
      >
        {variant === "full" && (
          <>
            <a href="#usage" style={{ color: "inherit" }}>
              <span style={{ color: "var(--cyan-dim)" }}>›</span> usage
            </a>
            <a href="#features" style={{ color: "inherit" }}>
              <span style={{ color: "var(--cyan-dim)" }}>›</span> features
            </a>
          </>
        )}
        <Link href="/settings" style={{ color: "inherit" }}>
          <span style={{ color: "var(--cyan-dim)" }}>›</span> settings
        </Link>
        {user && (
          <Link href="/me" style={{ color: "inherit" }}>
            <span style={{ color: "var(--cyan-dim)" }}>›</span> me
          </Link>
        )}
      </nav>

      {user ? (
        <span
          className="mono"
          style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: 0.5 }}
        >
          <span style={{ color: "var(--green)" }}>●</span> {user.email}
        </span>
      ) : (
        <Link
          href="/login"
          className="clip-notch-sm mono"
          style={{
            padding: "7px 14px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.2,
            color: "var(--text)",
            background: "transparent",
            border: "1px solid var(--line2)",
            textTransform: "uppercase",
          }}
        >
          ログイン
        </Link>
      )}
    </header>
  );
}
