"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toaster";

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export function ProfileEditor({ initial }: { initial: Profile }) {
  const [displayName, setDisplayName] = useState(initial.display_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim(),
          avatar_url: avatarUrl.trim() || null,
        }),
      });
      if (!res.ok) throw new Error(`http ${res.status}`);
      toast.show({ kind: "success", message: "プロフィールを更新しました" });
    } catch (e) {
      toast.show({ kind: "error", title: "保存に失敗", message: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      style={{
        padding: 16,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        marginBottom: 24,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar url={avatarUrl} name={displayName || "?"} />
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>プロフィール</h2>
          <div style={{ color: "#9aa3b5", fontSize: 12 }}>他の人に共有した時に表示される名前とアイコン</div>
        </div>
      </div>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 12, color: "#c5cad6" }}>表示名</span>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          style={input()}
          maxLength={60}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 12, color: "#c5cad6" }}>アバターURL (任意)</span>
        <input
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          style={input()}
          placeholder="https://..."
          maxLength={512}
        />
      </label>
      <div>
        <button onClick={save} disabled={saving} style={btnPrimary()}>
          {saving ? "保存中…" : "保存"}
        </button>
      </div>
    </section>
  );
}

function Avatar({ url, name }: { url: string; name: string }) {
  const fallback = name.slice(0, 1) || "?";
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt=""
        width={48}
        height={48}
        style={{ width: 48, height: 48, borderRadius: 9999, objectFit: "cover", border: "1px solid var(--border)" }}
      />
    );
  }
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 9999,
        background: "var(--accent)",
        color: "#0b0d12",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 18,
      }}
    >
      {fallback}
    </div>
  );
}

function input(): React.CSSProperties {
  return {
    padding: "8px 10px", borderRadius: 8,
    background: "var(--surface-2)", border: "1px solid var(--border)",
    color: "var(--foreground)", fontSize: 13,
  };
}
function btnPrimary(): React.CSSProperties {
  return {
    padding: "7px 14px", borderRadius: 8,
    background: "var(--accent)", color: "#0b0d12",
    border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
  };
}
