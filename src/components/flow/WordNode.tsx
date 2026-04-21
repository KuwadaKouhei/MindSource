"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { WordNodeData } from "@/lib/yjs/binding";
import { createMindmapDocHandle } from "@/lib/yjs/nodeRenameBridge";
import { colorForGen } from "@/lib/flow/colors";
import { useColorScheme } from "./ColorSchemeContext";

function WordNodeInner({ id, data, selected }: NodeProps) {
  const d = data as WordNodeData;
  const scheme = useColorScheme();
  const genColor = colorForGen(scheme, d.generation);
  const isRoot = d.generation === 0;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(d.word);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(d.word);
  }, [d.word, editing]);

  useEffect(() => {
    if (editing) {
      const t = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [editing]);

  const commit = useCallback(() => {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === d.word) return;
    window.dispatchEvent(
      new CustomEvent(createMindmapDocHandle.RENAME_EVENT, {
        detail: { id, word: next },
      }),
    );
  }, [draft, d.word, id]);

  const cancel = useCallback(() => {
    setDraft(d.word);
    setEditing(false);
  }, [d.word]);

  const dotColor = isRoot ? "var(--amber)" : genColor;
  const borderColor = selected
    ? "var(--cyan)"
    : isRoot
      ? "var(--amber)"
      : "var(--line2)";
  const background = selected
    ? "linear-gradient(135deg, rgba(79,209,255,0.22), rgba(79,209,255,0.06))"
    : isRoot
      ? "linear-gradient(135deg, rgba(255,184,77,0.12), rgba(14,22,40,0.95))"
      : "var(--bg3)";
  const glow = selected
    ? "0 0 14px rgba(79,209,255,0.5)"
    : isRoot
      ? "0 0 10px rgba(255,184,77,0.35)"
      : "none";

  return (
    <div
      style={{
        filter: `drop-shadow(${glow})`,
      }}
    >
      <div
        onDoubleClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        className="clip-notch-sm"
        style={{
          minWidth: 108,
          padding: "7px 14px",
          background,
          border: `1.5px solid ${borderColor}`,
          color: "var(--text)",
          fontSize: isRoot ? 13 : 12.5,
          fontWeight: isRoot ? 700 : 500,
          fontFamily: "var(--font-noto)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          textAlign: "center",
          justifyContent: "center",
          transition: "border-color 0.15s, background 0.15s",
        }}
      >
        <Handle
          type="target"
          position={Position.Top}
          style={{
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: "none",
            background: "transparent",
            border: "none",
          }}
        />
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 9999,
            background: dotColor,
            boxShadow: isRoot ? "0 0 6px var(--amber)" : `0 0 4px ${genColor}`,
            flexShrink: 0,
          }}
        />
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
              e.stopPropagation();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="nodrag"
            style={{
              fontWeight: 500,
              background: "var(--bg2)",
              border: `1px solid var(--cyan)`,
              color: "var(--text)",
              padding: "2px 6px",
              fontSize: 13,
              outline: "none",
              minWidth: 80,
              maxWidth: 220,
              fontFamily: "var(--font-noto)",
            }}
          />
        ) : (
          <span>{d.word}</span>
        )}
        {d.score != null && !editing && !isRoot && (
          <span
            className="mono"
            style={{
              fontSize: 9,
              color: "var(--muted2)",
              background: "rgba(5,8,15,0.6)",
              padding: "1.5px 5px",
              letterSpacing: 0.3,
              border: "1px solid var(--line)",
            }}
          >
            {d.score.toFixed(2)}
          </span>
        )}
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: "none",
            background: "transparent",
            border: "none",
          }}
        />
      </div>
    </div>
  );
}

export const WordNode = memo(WordNodeInner);
