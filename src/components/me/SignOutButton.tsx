"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { listDrafts, deleteDraft } from "@/lib/storage/localDraft";

export function SignOutButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const run = async (clearDrafts: boolean) => {
    setOpen(false);
    if (clearDrafts) {
      try {
        const drafts = await listDrafts();
        for (const d of drafts) await deleteDraft(d.localId);
      } catch {
        /* ignore */
      }
    }
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <button onClick={() => setOpen(true)} style={triggerBtn()}>
        ログアウト
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 150, padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 420,
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14,
              padding: 22, display: "flex", flexDirection: "column", gap: 12,
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>ログアウトしますか？</h2>
            <p style={{ fontSize: 13, color: "#c5cad6", lineHeight: 1.6 }}>
              このブラウザに残っている匿名下書きの扱いを選んでください。
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              <button onClick={() => run(false)} style={btnPrimary()}>
                下書きを残してログアウト
              </button>
              <button onClick={() => run(true)} style={btnDanger()}>
                下書きも削除してログアウト
              </button>
              <button onClick={() => setOpen(false)} style={btn()}>
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function triggerBtn(): React.CSSProperties {
  return {
    padding: "6px 12px",
    borderRadius: 8,
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
    cursor: "pointer",
    fontSize: 13,
  };
}
function btn(): React.CSSProperties {
  return {
    padding: "9px 14px", borderRadius: 8,
    background: "var(--surface-2)", border: "1px solid var(--border)",
    color: "var(--foreground)", cursor: "pointer", fontSize: 13,
  };
}
function btnPrimary(): React.CSSProperties {
  return {
    padding: "9px 14px", borderRadius: 8,
    background: "var(--accent)", color: "#0b0d12", fontWeight: 700,
    border: "none", cursor: "pointer", fontSize: 13,
  };
}
function btnDanger(): React.CSSProperties {
  return {
    padding: "9px 14px", borderRadius: 8,
    background: "#ff6b7a", color: "#0b0d12", fontWeight: 700,
    border: "none", cursor: "pointer", fontSize: 13,
  };
}