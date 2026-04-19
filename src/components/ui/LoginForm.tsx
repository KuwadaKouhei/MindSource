"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setState("sending");
    setErrorMsg("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/callback?next=/me` },
      });
      if (error) throw error;
      setState("sent");
    } catch (err) {
      setState("error");
      setErrorMsg((err as Error).message);
    }
  };

  const signInGoogle = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/callback?next=/me` },
      });
      if (error) throw error;
    } catch (err) {
      setState("error");
      setErrorMsg((err as Error).message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <button
        type="button"
        onClick={signInGoogle}
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          background: "white",
          color: "#1f2937",
          fontWeight: 600,
          border: "1px solid var(--border)",
          cursor: "pointer",
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <GoogleLogo />
        Google でログイン
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#7a8190", fontSize: 11 }}>
        <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
        または
        <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          disabled={state === "sending"}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: "var(--accent)",
            color: "#0b0d12",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          {state === "sending" ? "送信中…" : "マジックリンクを送る"}
        </button>
        {state === "sent" && (
          <p style={{ color: "#8bffb8", fontSize: 13 }}>
            メールを確認してください。リンクをクリックするとログインされます。
          </p>
        )}
        {state === "error" && (
          <p style={{ color: "#ffb3bd", fontSize: 13 }}>{errorMsg || "エラーが発生しました"}</p>
        )}
      </form>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
      <path fill="#FFC107" d="M43.6 20.5H42V20.4H24v7.2h11.1C33.6 31.8 29.2 34.8 24 34.8c-6 0-10.9-4.9-10.9-10.9S18 13 24 13c2.8 0 5.4 1.1 7.3 2.8l5.1-5.1C33.2 7.6 28.9 5.8 24 5.8 13.9 5.8 5.8 13.9 5.8 24S13.9 42.2 24 42.2c10.2 0 17.6-7.2 17.6-17.6 0-1.4-.1-2.7-.4-4z" />
      <path fill="#FF3D00" d="M7.8 13.3l5.9 4.3C15.3 14 19.3 11 24 11c2.8 0 5.4 1.1 7.3 2.8l5.1-5.1C33.2 5.6 28.9 4 24 4c-7.1 0-13.2 4-16.2 9.3z" />
      <path fill="#4CAF50" d="M24 44c4.8 0 9.1-1.8 12.3-4.7l-5.7-4.8c-1.8 1.3-4.1 2.1-6.6 2.1-5.1 0-9.4-3-11.1-7.3l-5.8 4.5C9.7 39.8 16.3 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20.4H24v7.2h11.1c-.8 2.2-2.3 4.1-4.1 5.4l.1-.1 5.7 4.8c-.4.4 6.4-4.7 6.4-14 0-1.4-.1-2.7-.4-4z" />
    </svg>
  );
}
