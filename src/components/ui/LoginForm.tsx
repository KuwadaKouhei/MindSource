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

  return (
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
  );
}
