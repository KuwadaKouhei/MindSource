"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listDrafts, deleteDraft, type LocalDraft } from "@/lib/storage/localDraft";

export function DraftImporter() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<LocalDraft[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listDrafts().then(setDrafts);
  }, []);

  if (!drafts || drafts.length === 0) return null;

  const importAll = async () => {
    setBusy(true);
    try {
      for (const d of drafts) {
        const res = await fetch(`/api/maps/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: d.title,
            root_word: d.rootWord,
            snapshot: d.snapshot,
            settings_override: d.settingsOverride,
          }),
        });
        if (res.ok) {
          await deleteDraft(d.localId);
        }
      }
    } finally {
      setBusy(false);
      setDrafts([]);
      router.refresh();
    }
  };

  const discardAll = async () => {
    setBusy(true);
    for (const d of drafts) await deleteDraft(d.localId);
    setBusy(false);
    setDrafts([]);
  };

  return (
    <div
      style={{
        padding: 16,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        marginBottom: 24,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        ローカルドラフトが {drafts.length} 件あります
      </div>
      <div style={{ color: "#9aa3b5", fontSize: 13, marginBottom: 10 }}>
        匿名モードで作ったマインドマップをアカウントに取り込めます。
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={importAll} disabled={busy} style={primary()}>
          {busy ? "取り込み中…" : "取り込む"}
        </button>
        <button onClick={discardAll} disabled={busy} style={secondary()}>
          破棄する
        </button>
      </div>
    </div>
  );
}

function primary(): React.CSSProperties {
  return { padding: "7px 12px", borderRadius: 8, background: "var(--accent)", color: "#0b0d12", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 13 };
}
function secondary(): React.CSSProperties {
  return { padding: "7px 12px", borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)", cursor: "pointer", fontSize: 13 };
}
