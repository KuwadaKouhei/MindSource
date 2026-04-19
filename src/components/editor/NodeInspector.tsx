"use client";

import { useEffect, useState } from "react";
import type { Node } from "@xyflow/react";
import type { WordNodeData } from "@/lib/yjs/binding";

type Props = {
  node: Node<WordNodeData> | null;
  onRename: (id: string, word: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onExpand: (id: string) => void;
  expanding: boolean;
};

export function NodeInspector({ node, onRename, onDelete, onAddChild, onExpand, expanding }: Props) {
  const [text, setText] = useState("");

  useEffect(() => {
    setText(node?.data?.word ?? "");
  }, [node?.id, node?.data?.word]);

  if (!node) {
    return (
      <aside style={aside()}>
        <div style={{ color: "#9aa3b5", fontSize: 13 }}>
          ノードを選択すると編集パネルが表示されます
        </div>
      </aside>
    );
  }

  const d = node.data;
  return (
    <aside style={aside()}>
      <div style={{ fontSize: 11, color: "#9aa3b5", marginBottom: 6 }}>
        世代 G{d.generation}
        {d.score != null && <> ・ スコア {d.score.toFixed(3)}</>}
      </div>
      <label style={{ fontSize: 12, color: "#c5cad6" }}>ラベル</label>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (text.trim() && text !== d.word) onRename(node.id, text.trim());
        }}
        style={inputStyle()}
      />
      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        <button onClick={() => onAddChild(node.id)} style={btn()}>
          子を追加
        </button>
        <button
          onClick={() => onExpand(node.id)}
          disabled={expanding}
          style={btnAccent()}
          title="この語の連想を1世代自動取得"
        >
          {expanding ? "取得中…" : "連想を追加"}
        </button>
        <button onClick={() => onDelete(node.id)} style={btnDanger()}>
          削除
        </button>
      </div>
    </aside>
  );
}

function aside(): React.CSSProperties {
  return {
    width: 280,
    borderLeft: "1px solid var(--border)",
    background: "var(--surface)",
    padding: 16,
    overflowY: "auto",
  };
}
function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: "7px 10px",
    borderRadius: 8,
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
    fontSize: 13,
    marginTop: 4,
  };
}
function btn(): React.CSSProperties {
  return {
    padding: "6px 10px",
    borderRadius: 8,
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
    cursor: "pointer",
    fontSize: 12,
  };
}
function btnAccent(): React.CSSProperties {
  return { ...btn(), background: "var(--accent)", borderColor: "var(--accent)", color: "#0b0d12", fontWeight: 600 };
}
function btnDanger(): React.CSSProperties {
  return { ...btn(), background: "#3a1a1f", borderColor: "#6a2734", color: "#ffb3bd" };
}
