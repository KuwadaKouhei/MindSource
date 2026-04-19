import Link from "next/link";
import { getSession } from "@/lib/supabase/server";

export async function Header() {
  const user = await getSession();
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      <Link href="/" style={{ fontWeight: 700, fontSize: 16, letterSpacing: 0.3 }}>
        MindSource
      </Link>
      <nav style={{ display: "flex", gap: 14, fontSize: 13 }}>
        <Link href="/">ホーム</Link>
        <Link href="/settings">設定</Link>
        {user && <Link href="/me">マイページ</Link>}
      </nav>
      <div style={{ flex: 1 }} />
      {user ? (
        <span style={{ fontSize: 13, color: "#c5cad6" }}>{user.email}</span>
      ) : (
        <Link
          href="/login"
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            background: "var(--accent)",
            color: "#0b0d12",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          ログイン
        </Link>
      )}
    </header>
  );
}
