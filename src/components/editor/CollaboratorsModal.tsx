"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toaster";

type Collaborator = {
  user_id: string;
  role: "viewer" | "editor";
  profiles?: { display_name: string | null; avatar_url: string | null } | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  mapId: string;
};

export function CollaboratorsModal({ open, onClose, mapId }: Props) {
  const [list, setList] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [newId, setNewId] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("editor");
  const [adding, setAdding] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/maps/${mapId}/collaborators`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setList(d.collaborators ?? []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [open, mapId]);

  const add = async () => {
    const id = newId.trim();
    if (!id) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/maps/${mapId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: id, role }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `http ${res.status}`);
      setNewId("");
      // reload
      const r = await fetch(`/api/maps/${mapId}/collaborators`, { credentials: "include" });
      const d = await r.json();
      setList(d.collaborators ?? []);
      toast.show({ kind: "success", message: "コラボレーターを追加しました" });
    } catch (e) {
      toast.show({ kind: "error", title: "追加に失敗", message: (e as Error).message });
    } finally {
      setAdding(false);
    }
  };

  const remove = async (userId: string) => {
    try {
      const res = await fetch(
        `/api/maps/${mapId}/collaborators?user_id=${encodeURIComponent(userId)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error(`http ${res.status}`);
      setList((prev) => prev.filter((c) => c.user_id !== userId));
    } catch (e) {
      toast.show({ kind: "error", title: "削除に失敗", message: (e as Error).message });
    }
  };

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 150, padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14,
          padding: 22, display: "flex", flexDirection: "column", gap: 14,
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        }}
      >
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>コラボレーター管理</h2>
          <p style={{ fontSize: 12, color: "#9aa3b5", marginTop: 4 }}>
            ユーザーIDを共有してもらい、ここに貼り付けて追加します (マイページで自分のIDを確認できます)。
          </p>
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#c5cad6", marginBottom: 6 }}>現在のメンバー</div>
          {loading ? (
            <div style={{ fontSize: 12, color: "#9aa3b5" }}>読み込み中…</div>
          ) : list.length === 0 ? (
            <div style={{ fontSize: 12, color: "#9aa3b5" }}>まだ誰も招待されていません。</div>
          ) : (
            <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {list.map((c) => (
                <li
                  key={c.user_id}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 10px",
                    background: "var(--surface-2)", border: "1px solid var(--border)",
                    borderRadius: 8, fontSize: 12,
                  }}
                >
                  <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                    <div style={{ fontWeight: 600 }}>
                      {c.profiles?.display_name ?? "(名前未設定)"}
                    </div>
                    <div style={{ color: "#7a8190", fontFamily: "monospace", fontSize: 10 }}>
                      {c.user_id}
                    </div>
                  </div>
                  <span style={{ color: "#9aa3b5" }}>{c.role}</span>
                  <button onClick={() => remove(c.user_id)} style={btnDanger()}>削除</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <div style={{ fontSize: 12, color: "#c5cad6", marginBottom: 6 }}>ユーザーID で招待</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              placeholder="UUID"
              style={input()}
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "viewer" | "editor")}
              style={input()}
            >
              <option value="editor">editor</option>
              <option value="viewer">viewer</option>
            </select>
            <button onClick={add} disabled={adding || !newId.trim()} style={btnPrimary()}>
              {adding ? "…" : "追加"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={btn()}>閉じる</button>
        </div>
      </div>
    </div>
  );
}

function input(): React.CSSProperties {
  return {
    padding: "7px 10px", borderRadius: 8,
    background: "var(--surface-2)", border: "1px solid var(--border)",
    color: "var(--foreground)", fontSize: 12,
    flex: 1,
  };
}
function btn(): React.CSSProperties {
  return {
    padding: "7px 12px", borderRadius: 8,
    background: "var(--surface-2)", border: "1px solid var(--border)",
    color: "var(--foreground)", cursor: "pointer", fontSize: 12,
  };
}
function btnPrimary(): React.CSSProperties {
  return {
    padding: "7px 12px", borderRadius: 8,
    background: "var(--accent)", color: "#0b0d12", fontWeight: 700,
    border: "none", cursor: "pointer", fontSize: 12,
  };
}
function btnDanger(): React.CSSProperties {
  return {
    padding: "4px 8px", borderRadius: 6,
    background: "#3a1a1f", border: "1px solid #6a2734",
    color: "#ffb3bd", cursor: "pointer", fontSize: 11,
  };
}
