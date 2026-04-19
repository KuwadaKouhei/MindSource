"use client";

import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { WordNodeData } from "@/lib/yjs/binding";
import { createMindmapDocHandle } from "@/lib/yjs/nodeRenameBridge";
import { colorForGen } from "@/lib/flow/colors";
import { useColorScheme } from "./ColorSchemeContext";

function WordNodeInner({ id, data, selected }: NodeProps) {
  const d = data as WordNodeData;
  const scheme = useColorScheme();
  const color = colorForGen(scheme, d.generation);
  const rf = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(d.word);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Keep draft in sync when the label is updated by another client or auto-gen
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
    // Dispatch a custom event; Canvas listens and writes to Y.Doc (single source of truth).
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

  return (
    <div
      onDoubleClick={(e) => {
        // Swallow the event so Canvas.onNodeDoubleClick (expand) does not fire.
        e.stopPropagation();
        setEditing(true);
      }}
      style={{
        minWidth: 120,
        padding: "8px 14px",
        borderRadius: 14,
        background: "var(--surface)",
        border: `1.5px solid ${selected ? color : "var(--border)"}`,
        boxShadow: selected ? `0 0 0 3px ${color}33` : undefined,
        color: "var(--foreground)",
        fontSize: 14,
        display: "flex",
        alignItems: "center",
        gap: 8,
        textAlign: "center",
        justifyContent: "center",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color }} />
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 9999,
          background: color,
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
            background: "var(--surface-2)",
            border: `1px solid ${color}`,
            borderRadius: 6,
            color: "var(--foreground)",
            padding: "2px 6px",
            fontSize: 14,
            outline: "none",
            minWidth: 80,
            maxWidth: 220,
          }}
        />
      ) : (
        <span style={{ fontWeight: 500 }}>{d.word}</span>
      )}
      {d.score != null && !editing && (
        <span
          style={{
            fontSize: 10,
            color: "#9aa3b5",
            background: "var(--surface-2)",
            padding: "2px 6px",
            borderRadius: 8,
          }}
        >
          {d.score.toFixed(2)}
        </span>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: color }} />
    </div>
  );
}

export const WordNode = memo(WordNodeInner);
