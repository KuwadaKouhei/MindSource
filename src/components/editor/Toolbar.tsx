"use client";

import { useState } from "react";
import type { Settings } from "@/lib/settings/schema";

type Props = {
  title: string;
  onTitleChange: (t: string) => void;
  onCascade: (word: string) => void;
  onExpandSelected: () => void;
  onReLayout: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onShare: () => void;
  onSave?: () => void;
  saveState?: "idle" | "saving" | "saved" | "error";
  autoMode: Settings["auto_mode"];
  selectedId: string | null;
  loading: boolean;
  onToggleTree: () => void;
  treeOpen: boolean;
};

export function Toolbar(p: Props) {
  const [seed, setSeed] = useState("");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        flexWrap: "wrap",
      }}
    >
      <button
        onClick={p.onToggleTree}
        style={{
          ...btn(),
          background: p.treeOpen ? "var(--accent)" : "var(--surface-2)",
          color: p.treeOpen ? "#0b0d12" : "var(--foreground)",
          fontWeight: p.treeOpen ? 700 : 500,
        }}
        title="ツリー表示"
      >
        ☰ ツリー
      </button>
      <input
        value={p.title}
        onChange={(e) => p.onTitleChange(e.target.value)}
        placeholder="タイトル"
        style={inputStyle()}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder="起点ワード"
          style={inputStyle()}
          onKeyDown={(e) => {
            if (e.key === "Enter" && seed.trim()) p.onCascade(seed.trim());
          }}
        />
        <button
          onClick={() => seed.trim() && p.onCascade(seed.trim())}
          disabled={p.loading || !seed.trim()}
          style={btnPrimary()}
        >
          {p.loading ? "生成中…" : "自動生成 (cascade)"}
        </button>
      </div>
      <button
        onClick={p.onExpandSelected}
        disabled={p.loading || !p.selectedId}
        style={btn()}
        title="選択ノードから連想を1世代展開"
      >
        展開 (expand)
      </button>
      <button onClick={p.onReLayout} style={btn()}>再レイアウト</button>
      <div style={{ flex: 1 }} />
      {p.onSave && (
        <button onClick={p.onSave} style={btn()}>
          {p.saveState === "saving" ? "保存中…" : p.saveState === "saved" ? "保存済み" : "保存"}
        </button>
      )}
      <button onClick={p.onExportPng} style={btn()}>PNG</button>
      <button onClick={p.onExportSvg} style={btn()}>SVG</button>
      <button onClick={p.onShare} style={btn()}>共有</button>
    </div>
  );
}

function btn(): React.CSSProperties {
  return {
    padding: "7px 12px",
    borderRadius: 8,
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
    cursor: "pointer",
    fontSize: 13,
  };
}

function btnPrimary(): React.CSSProperties {
  return {
    padding: "7px 12px",
    borderRadius: 8,
    background: "var(--accent)",
    border: "1px solid var(--accent)",
    color: "#0b0d12",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 13,
  };
}

function inputStyle(): React.CSSProperties {
  return {
    padding: "7px 10px",
    borderRadius: 8,
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
    fontSize: 13,
  };
}
