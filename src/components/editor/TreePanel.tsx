"use client";

import { useMemo, useState } from "react";
import type { Edge, Node } from "@xyflow/react";
import type { WordNodeData } from "@/lib/yjs/binding";
import { colorForGen } from "@/lib/flow/colors";
import { useColorScheme } from "@/components/flow/ColorSchemeContext";
import { Glyph } from "@/components/ui/primitives/Glyph";

type TreeNode = {
  id: string;
  word: string;
  generation: number;
  score: number | null;
  children: TreeNode[];
};

function buildForest(nodes: Node<WordNodeData>[], edges: Edge[]): TreeNode[] {
  const byId = new Map<string, Node<WordNodeData>>();
  for (const n of nodes) byId.set(n.id, n);

  const parentOf = new Map<string, string>();
  for (const e of edges) {
    const existing = parentOf.get(e.target);
    if (!existing) {
      parentOf.set(e.target, e.source);
      continue;
    }
    const prevGen = (byId.get(existing)?.data as WordNodeData | undefined)?.generation ?? 0;
    const candGen = (byId.get(e.source)?.data as WordNodeData | undefined)?.generation ?? 0;
    if (candGen < prevGen) parentOf.set(e.target, e.source);
  }

  const childrenOf = new Map<string, string[]>();
  for (const [child, parent] of parentOf) {
    if (!childrenOf.has(parent)) childrenOf.set(parent, []);
    childrenOf.get(parent)!.push(child);
  }

  const toTree = (id: string): TreeNode => {
    const n = byId.get(id);
    const d = (n?.data ?? {}) as WordNodeData;
    const kids = (childrenOf.get(id) ?? [])
      .map(toTree)
      .sort((a, b) => a.generation - b.generation || a.word.localeCompare(b.word, "ja"));
    return {
      id,
      word: d.word ?? id,
      generation: d.generation ?? 0,
      score: d.score ?? null,
      children: kids,
    };
  };

  const roots = nodes
    .filter((n) => !parentOf.has(n.id))
    .map((n) => toTree(n.id))
    .sort((a, b) => a.generation - b.generation || a.word.localeCompare(b.word, "ja"));
  return roots;
}

function collectIds(forest: TreeNode[], acc: Set<string>) {
  for (const n of forest) {
    if (n.children.length) {
      acc.add(n.id);
      collectIds(n.children, acc);
    }
  }
}

type Props = {
  nodes: Node<WordNodeData>[];
  edges: Edge[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function TreePanel({ nodes, edges, selectedId, onSelect }: Props) {
  const forest = useMemo(() => buildForest(nodes, edges), [nodes, edges]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const scheme = useColorScheme();

  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filter = query.trim().toLowerCase();
  const matches = (w: string) => !filter || w.toLowerCase().includes(filter);

  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () => {
    const ids = new Set<string>();
    collectIds(forest, ids);
    setCollapsed(ids);
  };

  return (
    <aside
      style={{
        width: "100%",
        height: "100%",
        background: "var(--bg2)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 14px 8px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <Glyph name="listTree" size={14} style={{ color: "var(--cyan)" }} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--text)",
              letterSpacing: 0.3,
            }}
          >
            / ツリー
          </span>
        </div>
        <div
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: 0.6,
            color: "var(--muted)",
            marginBottom: 10,
          }}
        >
          / outline · {nodes.length} nodes
        </div>
        <div
          className="clip-notch-sm"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "0 8px",
            height: 26,
            background: "var(--bg3)",
            border: "1px solid var(--line2)",
          }}
        >
          <Glyph name="search" size={12} style={{ color: "var(--muted)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="filter…"
            className="mono"
            style={{
              flex: 1,
              minWidth: 0,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text)",
              fontSize: 11,
              letterSpacing: 0.3,
            }}
          />
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "auto", padding: "6px 4px" }}>
        {forest.length === 0 ? (
          <div
            className="mono"
            style={{ color: "var(--muted)", fontSize: 11, padding: "14px 12px" }}
          >
            &gt; no nodes yet
          </div>
        ) : (
          forest.map((root) => (
            <TreeItem
              key={root.id}
              node={root}
              depth={0}
              collapsed={collapsed}
              onToggle={toggle}
              onSelect={onSelect}
              selectedId={selectedId}
              matches={matches}
              filterActive={!!filter}
              scheme={scheme}
              isRoot
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "8px 10px",
          borderTop: "1px solid var(--line)",
          display: "flex",
          gap: 6,
        }}
      >
        <button
          onClick={expandAll}
          className="clip-notch-sm mono"
          style={footerBtnStyle}
        >
          ↓ 全展開
        </button>
        <button
          onClick={collapseAll}
          className="clip-notch-sm mono"
          style={footerBtnStyle}
        >
          ↑ 全折畳
        </button>
      </div>
    </aside>
  );
}

const footerBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "5px 8px",
  fontSize: 10,
  letterSpacing: 0.4,
  color: "var(--muted2)",
  background: "var(--bg3)",
  border: "1px solid var(--line2)",
  cursor: "pointer",
};

type TreeItemProps = {
  node: TreeNode;
  depth: number;
  collapsed: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  selectedId: string | null;
  matches: (word: string) => boolean;
  filterActive: boolean;
  scheme: string;
  isRoot?: boolean;
};

function TreeItem({
  node,
  depth,
  collapsed,
  onToggle,
  onSelect,
  selectedId,
  matches,
  filterActive,
  scheme,
  isRoot = false,
}: TreeItemProps) {
  const selfMatches = matches(node.word);
  const anyDescendantMatches = filterActive && hasMatch(node.children, matches);
  if (filterActive && !selfMatches && !anyDescendantMatches) return null;

  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsed.has(node.id);
  const genColor = colorForGen(scheme, node.generation);
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        onClick={() => onSelect(node.id)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "4px 8px 4px 6px",
          paddingLeft: 6 + depth * 14,
          cursor: "pointer",
          position: "relative",
          background: isSelected
            ? "linear-gradient(90deg, rgba(79,209,255,0.14), rgba(79,209,255,0.04))"
            : "transparent",
          boxShadow: isSelected ? "inset 2px 0 0 var(--cyan)" : undefined,
          color: isSelected ? "var(--text)" : "var(--muted2)",
          fontSize: 12,
          transition: "background 0.12s",
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node.id);
          }}
          style={{
            width: 14,
            height: 14,
            border: "none",
            background: "transparent",
            color: hasChildren ? "var(--muted2)" : "transparent",
            cursor: hasChildren ? "pointer" : "default",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            transform: hasChildren && !isCollapsed ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.15s",
          }}
        >
          {hasChildren ? <Glyph name="chevron" size={10} /> : null}
        </button>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 9999,
            background: isRoot ? "var(--amber)" : genColor,
            boxShadow: isRoot ? "0 0 5px var(--amber)" : undefined,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: isSelected || isRoot ? 700 : 400,
            color: isSelected ? "var(--text)" : isRoot ? "var(--text)" : "var(--muted2)",
          }}
        >
          {node.word}
        </span>
        {node.score != null && (
          <span
            className="mono"
            style={{ color: "var(--muted)", fontSize: 9.5, letterSpacing: 0.3 }}
          >
            {node.score.toFixed(2)}
          </span>
        )}
      </div>
      {hasChildren && !isCollapsed && (
        <div
          style={{
            position: "relative",
            marginLeft: 6 + depth * 14 + 7,
            borderLeft: "1px solid var(--line)",
          }}
        >
          {node.children.map((c) => (
            <TreeItem
              key={c.id}
              node={c}
              depth={depth + 1}
              collapsed={collapsed}
              onToggle={onToggle}
              onSelect={onSelect}
              selectedId={selectedId}
              matches={matches}
              filterActive={filterActive}
              scheme={scheme}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function hasMatch(children: TreeNode[], m: (w: string) => boolean): boolean {
  for (const c of children) {
    if (m(c.word)) return true;
    if (hasMatch(c.children, m)) return true;
  }
  return false;
}
