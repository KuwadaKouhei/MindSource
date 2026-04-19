"use client";

import { useMemo, useState } from "react";
import type { Edge, Node } from "@xyflow/react";
import type { WordNodeData } from "@/lib/yjs/binding";

const GEN_COLORS = [
  "#7c9cff",
  "#a28bff",
  "#ff8bd0",
  "#ffb47a",
  "#8bffb8",
  "#ffd76b",
];

type TreeNode = {
  id: string;
  word: string;
  generation: number;
  score: number | null;
  children: TreeNode[];
};

function buildForest(nodes: Node<WordNodeData>[], edges: Edge[]): TreeNode[] {
  // Build adjacency (parent -> children). If a node has multiple parents
  // (DAG from cascade), attach it under the lowest-generation parent only
  // so the tree stays a tree rather than duplicating subgraphs.
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

type Props = {
  nodes: Node<WordNodeData>[];
  edges: Edge[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function TreePanel({ nodes, edges, selectedId, onSelect, onClose }: Props) {
  const forest = useMemo(() => buildForest(nodes, edges), [nodes, edges]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

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

  return (
    <aside
      style={{
        width: 280,
        borderRight: "1px solid var(--border)",
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <strong style={{ fontSize: 13 }}>ツリー ({nodes.length})</strong>
        <button onClick={onClose} style={closeBtn()} title="閉じる">
          ×
        </button>
      </div>
      <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="検索…"
          style={{
            width: "100%",
            padding: "6px 8px",
            borderRadius: 6,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
            fontSize: 12,
          }}
        />
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "8px 4px" }}>
        {forest.length === 0 ? (
          <div style={{ color: "#9aa3b5", fontSize: 12, padding: 12 }}>
            ノードがありません
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
            />
          ))
        )}
      </div>
    </aside>
  );
}

type TreeItemProps = {
  node: TreeNode;
  depth: number;
  collapsed: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  selectedId: string | null;
  matches: (word: string) => boolean;
  filterActive: boolean;
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
}: TreeItemProps) {
  // Show a branch if it or any descendant matches the filter.
  const selfMatches = matches(node.word);
  const anyDescendantMatches = filterActive && hasMatch(node.children, matches);
  if (filterActive && !selfMatches && !anyDescendantMatches) return null;

  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsed.has(node.id);
  const color = GEN_COLORS[node.generation % GEN_COLORS.length];
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        onClick={() => onSelect(node.id)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "4px 6px",
          paddingLeft: 6 + depth * 14,
          borderRadius: 6,
          cursor: "pointer",
          background: isSelected ? "var(--surface-2)" : "transparent",
          border: isSelected ? `1px solid ${color}` : "1px solid transparent",
          color: "var(--foreground)",
          fontSize: 12,
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node.id);
          }}
          style={{
            width: 16,
            height: 16,
            border: "none",
            background: "transparent",
            color: hasChildren ? "var(--foreground)" : "transparent",
            fontSize: 10,
            cursor: hasChildren ? "pointer" : "default",
            padding: 0,
          }}
        >
          {hasChildren ? (isCollapsed ? "▶" : "▼") : "·"}
        </button>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 9999,
            background: color,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: isSelected ? 600 : 400,
          }}
        >
          {node.word}
        </span>
        {node.score != null && (
          <span style={{ color: "#7a8190", fontSize: 10 }}>{node.score.toFixed(2)}</span>
        )}
      </div>
      {hasChildren && !isCollapsed && (
        <div>
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

function closeBtn(): React.CSSProperties {
  return {
    width: 22,
    height: 22,
    borderRadius: 6,
    border: "1px solid var(--border)",
    background: "var(--surface-2)",
    color: "var(--foreground)",
    cursor: "pointer",
    fontSize: 14,
    lineHeight: 1,
  };
}
