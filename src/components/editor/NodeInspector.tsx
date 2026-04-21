"use client";

import { useEffect, useMemo, useState } from "react";
import type { Edge, Node } from "@xyflow/react";
import type { WordNodeData } from "@/lib/yjs/binding";
import { Tag } from "@/components/ui/primitives/Tag";
import { Glyph } from "@/components/ui/primitives/Glyph";
import { Button } from "@/components/ui/primitives/Button";
import { colorForGen } from "@/lib/flow/colors";
import { useColorScheme } from "@/components/flow/ColorSchemeContext";
import { useToast } from "@/components/ui/Toaster";

type Props = {
  node: Node<WordNodeData> | null;
  nodes: Node<WordNodeData>[];
  edges: Edge[];
  onRename: (id: string, word: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onExpand: (id: string) => void;
  onReLayout: () => void;
  onFocusNode: (id: string) => void;
  expanding: boolean;
};

export function NodeInspector({
  node,
  nodes,
  edges,
  onRename,
  onDelete,
  onAddChild,
  onExpand,
  onReLayout,
  onFocusNode,
  expanding,
}: Props) {
  const [label, setLabel] = useState("");
  const [memo, setMemo] = useState("");
  const scheme = useColorScheme();
  const toast = useToast();

  useEffect(() => {
    setLabel(node?.data?.word ?? "");
    // NOTE: memo is local-only for now; not yet persisted in Y.Doc.
    setMemo("");
  }, [node?.id, node?.data?.word]);

  const parent = useMemo(() => {
    if (!node) return null;
    const edge = edges.find((e) => e.target === node.id);
    if (!edge) return null;
    return nodes.find((n) => n.id === edge.source) ?? null;
  }, [node, nodes, edges]);

  const children = useMemo(() => {
    if (!node) return [];
    return edges
      .filter((e) => e.source === node.id)
      .map((e) => nodes.find((n) => n.id === e.target))
      .filter((n): n is Node<WordNodeData> => !!n);
  }, [node, nodes, edges]);

  if (!node) {
    return (
      <aside style={aside}>
        <Tag>● NODE INSPECTOR</Tag>
        <div
          className="mono"
          style={{
            marginTop: 18,
            color: "var(--muted)",
            fontSize: 12,
            letterSpacing: 0.4,
            lineHeight: 1.7,
          }}
        >
          &gt; no_selection
          <br />
          <span style={{ color: "var(--muted2)" }}>
            キャンバスからノードを選択してください。
          </span>
        </div>
      </aside>
    );
  }

  const d = node.data as WordNodeData;
  const shortId = `n_${node.id.replace(/^n_/, "").slice(0, 4)}`;
  const genColor = colorForGen(scheme, d.generation);

  return (
    <aside style={aside}>
      <Tag>● NODE INSPECTOR</Tag>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          marginTop: 10,
          marginBottom: 4,
          wordBreak: "break-word",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: 9999,
            background: d.generation === 0 ? "var(--amber)" : genColor,
            marginRight: 8,
            transform: "translateY(-2px)",
          }}
        />
        {d.word}
      </h2>
      <div
        className="mono"
        style={{
          fontSize: 10.5,
          color: "var(--muted)",
          letterSpacing: 0.4,
          marginBottom: 16,
        }}
      >
        id: <span style={{ color: "var(--cyan)" }}>{shortId}</span>
        {"  ·  "}depth{" "}
        <span style={{ color: "var(--cyan)" }}>{d.generation}</span>
        {parent && (
          <>
            {"  ·  "}parent:{" "}
            <span style={{ color: "var(--text)" }}>
              {(parent.data as WordNodeData).word}
            </span>
          </>
        )}
      </div>

      {/* Stat grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6,
          marginBottom: 18,
        }}
      >
        <Stat label="Similarity" value={d.score != null ? d.score.toFixed(3) : "—"} />
        <Stat label="Children" value={String(children.length)} />
        <Stat label="POS" value="名詞" muted />
        <Stat label="Sources" value="chiVe" muted />
      </div>

      {/* label section */}
      <SectionHeader>/ label</SectionHeader>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => {
          if (label.trim() && label !== d.word) onRename(node.id, label.trim());
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="clip-notch-sm"
        style={inputStyle}
      />
      <textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="memo (※ 保存はまだ未対応 / local only)"
        className="clip-notch-sm"
        style={{ ...inputStyle, marginTop: 6, minHeight: 64, resize: "vertical" }}
      />

      {/* children section */}
      <SectionHeader>
        / children · <span style={{ color: "var(--cyan)" }}>{children.length}</span>
      </SectionHeader>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          marginBottom: 8,
        }}
      >
        {children.map((c) => {
          const cd = c.data as WordNodeData;
          const col = colorForGen(scheme, cd.generation);
          return (
            <div
              key={c.id}
              onClick={() => onFocusNode(c.id)}
              className="child-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 8px",
                background: "var(--bg3)",
                border: "1px solid var(--line)",
                fontSize: 12,
                cursor: "pointer",
                clipPath:
                  "polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 9999,
                  background: col,
                }}
              />
              <span
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {cd.word}
              </span>
              {cd.score != null && (
                <span
                  className="mono"
                  style={{ fontSize: 10, color: "var(--muted)" }}
                >
                  {cd.score.toFixed(2)}
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                title="削除"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 18,
                  height: 18,
                  background: "transparent",
                  border: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                }}
                className="child-x"
              >
                <Glyph name="x" size={11} />
              </button>
            </div>
          );
        })}
        {children.length === 0 && (
          <div
            className="mono"
            style={{ fontSize: 11, color: "var(--muted)", padding: "4px 2px" }}
          >
            &gt; no children
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        <Button variant="tb" onClick={() => onAddChild(node.id)}>
          <Glyph name="plus" size={12} /> 子ノード追加
        </Button>
        <Button
          variant="tb-active"
          onClick={() => onExpand(node.id)}
          disabled={expanding}
          title="1世代自動展開"
        >
          <Glyph name="check" size={12} />
          {expanding ? "取得中…" : "1世代 expand"}
        </Button>
      </div>

      {/* actions */}
      <SectionHeader>/ actions</SectionHeader>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Button
          variant="tb"
          onClick={() =>
            toast.show({
              kind: "warning",
              title: "複製",
              message: "この機能はまだ実装されていません。",
            })
          }
        >
          <Glyph name="copy" size={12} /> 複製
        </Button>
        <Button variant="tb" onClick={onReLayout}>
          <Glyph name="refresh" size={12} /> 再配置
        </Button>
        <Button variant="danger" onClick={() => onDelete(node.id)}>
          <Glyph name="trash" size={12} /> 削除
        </Button>
      </div>
    </aside>
  );
}

const aside: React.CSSProperties = {
  width: "100%",
  height: "100%",
  borderLeft: "1px solid var(--line)",
  background: "var(--bg2)",
  padding: "16px 16px 22px",
  overflowY: "auto",
  overflowX: "hidden",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: "var(--bg3)",
  border: "1px solid var(--line2)",
  outline: "none",
  color: "var(--text)",
  fontSize: 13,
  fontFamily: "var(--font-noto)",
};

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mono"
      style={{
        fontSize: 10.5,
        letterSpacing: 1.4,
        color: "var(--muted)",
        textTransform: "uppercase",
        marginBottom: 8,
        marginTop: 14,
      }}
    >
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div
      className="clip-notch-sm"
      style={{
        padding: "8px 10px",
        background: "var(--bg3)",
        border: "1px solid var(--line)",
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 9.5,
          letterSpacing: 1.1,
          color: "var(--muted)",
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        className="mono"
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: muted ? "var(--muted2)" : "var(--cyan)",
          letterSpacing: 0.3,
        }}
      >
        {value}
      </div>
    </div>
  );
}
