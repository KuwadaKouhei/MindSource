"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";

type Props = {
  loggedIn: boolean;
  triggerLabel: string;
  triggerStyle: React.CSSProperties;
};

export function NewMapModal({ loggedIn, triggerLabel, triggerStyle }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [seed, setSeed] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setTimeout(() => titleRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const finalTitle = title.trim() || "Untitled";
    const finalSeed = seed.trim();
    try {
      if (loggedIn) {
        const res = await fetch("/api/maps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: finalTitle, root_word: finalSeed || null }),
        });
        if (!res.ok) throw new Error("create_failed");
        const { id } = (await res.json()) as { id: string };
        const qs = finalSeed ? `?seed=${encodeURIComponent(finalSeed)}` : "";
        router.push(`/maps/${id}${qs}`);
      } else {
        const localId = nanoid(10);
        const params = new URLSearchParams();
        if (finalTitle && finalTitle !== "Untitled") params.set("title", finalTitle);
        if (finalSeed) params.set("seed", finalSeed);
        const qs = params.toString() ? `?${params.toString()}` : "";
        router.push(`/maps/local/${localId}${qs}`);
      }
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} style={triggerStyle}>
        {triggerLabel}
      </button>
      {open && (
        <div
          onClick={() => !busy && setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 20,
          }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            style={{
              width: "100%",
              maxWidth: 420,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 22,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700 }}>新しいマインドマップ</h2>
              <p style={{ fontSize: 12, color: "#9aa3b5", marginTop: 4 }}>
                タイトルと起点ワードを入力してください。起点ワードがあれば自動生成を実行します。
              </p>
            </div>

            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#c5cad6", fontWeight: 500 }}>タイトル</span>
              <input
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled"
                style={inputStyle()}
                maxLength={100}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#c5cad6", fontWeight: 500 }}>
                起点ワード(任意)
              </span>
              <input
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="例: 猫"
                style={inputStyle()}
                maxLength={40}
              />
              <span style={{ fontSize: 11, color: "#9aa3b5" }}>
                入力した場合、マップを開いた直後に連想を自動展開します。
              </span>
            </label>

            {error && (
              <div style={{ color: "#ffb3bd", fontSize: 12 }}>エラー: {error}</div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                style={btnSecondary()}
              >
                キャンセル
              </button>
              <button type="submit" disabled={busy} style={btnPrimary()}>
                {busy ? "作成中…" : "作成"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    padding: "9px 12px",
    borderRadius: 10,
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
    fontSize: 14,
  };
}
function btnPrimary(): React.CSSProperties {
  return {
    padding: "9px 16px",
    borderRadius: 10,
    background: "var(--accent)",
    color: "#0b0d12",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    fontSize: 13,
  };
}
function btnSecondary(): React.CSSProperties {
  return {
    padding: "9px 16px",
    borderRadius: 10,
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
    cursor: "pointer",
    fontSize: 13,
  };
}
