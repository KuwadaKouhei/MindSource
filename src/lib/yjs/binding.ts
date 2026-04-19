"use client";

import type { Edge, Node } from "@xyflow/react";
import * as Y from "yjs";
import type { MindmapDoc, YEdgeValue, YNodeValue } from "./doc";

export type WordNodeData = {
  word: string;
  generation: number;
  score: number | null;
};

export function yNodeToFlow(v: YNodeValue): Node<WordNodeData> {
  return {
    id: v.id,
    type: "word",
    position: v.position,
    data: { word: v.word, generation: v.generation, score: v.score },
  };
}

export function yEdgeToFlow(v: YEdgeValue): Edge {
  return {
    id: v.id,
    source: v.source,
    target: v.target,
    type: "smoothstep",
    data: { score: v.score },
    style: v.score != null ? { opacity: 0.35 + 0.65 * v.score } : undefined,
  };
}

export function flowNodeToY(n: Node<WordNodeData>): YNodeValue {
  return {
    id: n.id,
    word: n.data?.word ?? n.id,
    generation: n.data?.generation ?? 0,
    score: n.data?.score ?? null,
    position: n.position,
  };
}

export function readAllFromY(doc: MindmapDoc): { nodes: Node<WordNodeData>[]; edges: Edge[] } {
  const nodes: Node<WordNodeData>[] = [];
  doc.yNodes.forEach((v) => nodes.push(yNodeToFlow(v)));
  const edges: Edge[] = [];
  doc.yEdges.forEach((v) => edges.push(yEdgeToFlow(v)));
  return { nodes, edges };
}

export function bulkReplace(
  doc: MindmapDoc,
  nodes: Node<WordNodeData>[],
  edges: Edge[],
  meta?: { title?: string; rootWord?: string | null; layout?: string },
) {
  doc.ydoc.transact(() => {
    // Clear existing
    Array.from(doc.yNodes.keys()).forEach((k) => doc.yNodes.delete(k));
    Array.from(doc.yEdges.keys()).forEach((k) => doc.yEdges.delete(k));
    // Insert new
    for (const n of nodes) doc.yNodes.set(n.id, flowNodeToY(n));
    for (const e of edges) {
      doc.yEdges.set(e.id, {
        id: e.id,
        source: e.source,
        target: e.target,
        score: (e.data as { score?: number | null } | undefined)?.score ?? null,
      });
    }
    if (meta?.title !== undefined) doc.yMeta.set("title", meta.title);
    if (meta?.rootWord !== undefined) doc.yMeta.set("rootWord", meta.rootWord);
    if (meta?.layout !== undefined) doc.yMeta.set("layout", meta.layout);
  }, "bulk");
}

export function appendNodesAndEdges(
  doc: MindmapDoc,
  nodes: Node<WordNodeData>[],
  edges: Edge[],
) {
  doc.ydoc.transact(() => {
    for (const n of nodes) doc.yNodes.set(n.id, flowNodeToY(n));
    for (const e of edges) {
      doc.yEdges.set(e.id, {
        id: e.id,
        source: e.source,
        target: e.target,
        score: (e.data as { score?: number | null } | undefined)?.score ?? null,
      });
    }
  }, "append");
}

export function updateNodePosition(doc: MindmapDoc, id: string, pos: { x: number; y: number }) {
  const existing = doc.yNodes.get(id);
  if (!existing) return;
  doc.yNodes.set(id, { ...existing, position: pos });
}

export function updateNodeWord(doc: MindmapDoc, id: string, word: string) {
  const existing = doc.yNodes.get(id);
  if (!existing) return;
  doc.yNodes.set(id, { ...existing, word });
}

export function deleteNode(doc: MindmapDoc, id: string) {
  doc.ydoc.transact(() => {
    doc.yNodes.delete(id);
    // Remove incident edges
    const toRemove: string[] = [];
    doc.yEdges.forEach((e, k) => {
      if (e.source === id || e.target === id) toRemove.push(k);
    });
    toRemove.forEach((k) => doc.yEdges.delete(k));
  });
}

export function addEdge(doc: MindmapDoc, source: string, target: string) {
  const id = `${source}->${target}`;
  if (doc.yEdges.has(id)) return;
  doc.yEdges.set(id, { id, source, target, score: null });
}

export function deleteEdge(doc: MindmapDoc, id: string) {
  doc.yEdges.delete(id);
}

export function addChildNode(
  doc: MindmapDoc,
  parentId: string,
  word: string,
  position: { x: number; y: number },
) {
  const parent = doc.yNodes.get(parentId);
  const generation = parent ? parent.generation + 1 : 0;
  const id = `n_${Math.random().toString(36).slice(2, 10)}`;
  doc.ydoc.transact(() => {
    doc.yNodes.set(id, { id, word, generation, score: null, position });
    doc.yEdges.set(`${parentId}->${id}`, {
      id: `${parentId}->${id}`,
      source: parentId,
      target: id,
      score: null,
    });
  });
  return id;
}

export function serializeSnapshot(doc: MindmapDoc, viewport: { x: number; y: number; zoom: number } | null) {
  const { nodes, edges } = readAllFromY(doc);
  return { nodes, edges, viewport };
}

export function loadSnapshot(
  doc: MindmapDoc,
  snapshot: { nodes: Node[]; edges: Edge[] },
) {
  if (doc.yNodes.size > 0 || doc.yEdges.size > 0) return; // already populated
  doc.ydoc.transact(() => {
    for (const n of snapshot.nodes) {
      const data = (n.data ?? {}) as Partial<WordNodeData>;
      doc.yNodes.set(n.id, {
        id: n.id,
        word: data.word ?? n.id,
        generation: data.generation ?? 0,
        score: data.score ?? null,
        position: n.position,
      });
    }
    for (const e of snapshot.edges) {
      doc.yEdges.set(e.id, {
        id: e.id,
        source: e.source,
        target: e.target,
        score: (e.data as { score?: number | null } | undefined)?.score ?? null,
      });
    }
  });
}

export const Y_EXPORTED = Y;
