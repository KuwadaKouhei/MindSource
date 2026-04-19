"use client";

import ELK from "elkjs/lib/elk.bundled.js";
import type { Edge, Node } from "@xyflow/react";
import type { LayoutMode } from "@/lib/settings/schema";
import { ringGapForGen } from "@/lib/settings/defaults";

const elk = new ELK();

// Fallback sizes for nodes that haven't been rendered yet (no `measured` field).
// Once DOM measurement lands these are overridden per-node.
export const DEFAULT_NODE_W = 180;
export const DEFAULT_NODE_H = 64;
export const MIN_GAP = 16;

type Size = { width: number; height: number };
type ElkGraph = Parameters<typeof elk.layout>[0];

export function nodeSize(n: Node): Size {
  const m = (n as Node & { measured?: Size }).measured;
  return {
    width: m?.width ?? DEFAULT_NODE_W,
    height: m?.height ?? DEFAULT_NODE_H,
  };
}

export type LayoutOptions = {
  /** Per-generation pad used by the radial layout. See defaults.ts. */
  ringGaps?: number[];
};

export async function runLayout<N extends Node>(
  nodes: N[],
  edges: Edge[],
  mode: LayoutMode,
  options: LayoutOptions = {},
): Promise<N[]> {
  if (nodes.length === 0) return nodes;

  let positioned: N[];
  if (mode === "radial") {
    positioned = radialLayout(nodes, edges, options.ringGaps);
  } else {
    positioned = await elkLayout(nodes, edges, options.ringGaps);
  }
  return resolveOverlaps(positioned);
}

async function elkLayout<N extends Node>(
  nodes: N[],
  edges: Edge[],
  ringGaps?: number[],
): Promise<N[]> {
  // Base layer spacing — ring_gaps then re-scales each layer afterward so
  // deeper generations can sit closer to their parents than shallow ones.
  const graph: ElkGraph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.spacing.nodeNode": String(MIN_GAP + 8),
      "elk.layered.spacing.nodeNodeBetweenLayers": "80",
      "elk.spacing.edgeNode": "12",
      "elk.spacing.edgeEdge": "8",
    },
    children: nodes.map((n) => {
      const s = nodeSize(n);
      return { id: n.id, width: s.width, height: s.height };
    }),
    edges: edges.map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] })),
  };

  const res = await elk.layout(graph);
  const posById = new Map<string, { x: number; y: number }>();
  res.children?.forEach((c) => posById.set(c.id!, { x: c.x ?? 0, y: c.y ?? 0 }));

  // Figure out each node's depth via data.generation or BFS fallback, then
  // rewrite Y so each gen-N row sits (nodeHeight + ringGaps[N-1]) below the
  // previous row. X from ELK is preserved so siblings stay aligned.
  const gaps = ringGaps && ringGaps.length > 0 ? ringGaps : [120, 80];
  const gensMap = computeGenerations(nodes, edges);
  const nodeGen = (n: N): number =>
    (n.data as { generation?: number } | undefined)?.generation ??
    gensMap.get(n.id) ??
    0;

  // Row height per generation = tallest measured node in that gen.
  const rowHeight = new Map<number, number>();
  for (const n of nodes) {
    const g = nodeGen(n);
    const h = nodeSize(n).height;
    rowHeight.set(g, Math.max(rowHeight.get(g) ?? 0, h));
  }

  // Absolute Y for the top of each row.
  const rowY = new Map<number, number>();
  const sortedGens = [...rowHeight.keys()].sort((a, b) => a - b);
  let y = 0;
  for (let i = 0; i < sortedGens.length; i++) {
    const gen = sortedGens[i];
    rowY.set(gen, y);
    const h = rowHeight.get(gen)!;
    // gap below this row -> use ringGaps[gen] (pad between row `gen` and row `gen+1`)
    const nextGen = sortedGens[i + 1];
    if (nextGen !== undefined) {
      const pad = ringGapForGen(gaps, nextGen);
      y += h + pad;
    }
  }

  return nodes.map((n) => {
    const elkPos = posById.get(n.id) ?? n.position;
    const g = nodeGen(n);
    const h = nodeSize(n).height;
    const top = rowY.get(g) ?? 0;
    // Center the node vertically inside its row so tall/short nodes align.
    const rowCenterY = top + (rowHeight.get(g) ?? h) / 2;
    return { ...n, position: { x: elkPos.x, y: rowCenterY - h / 2 } };
  });
}

function radialLayout<N extends Node>(
  nodes: N[],
  edges: Edge[],
  ringGaps?: number[],
): N[] {
  const byGen = new Map<number, N[]>();
  const fallbackGen = computeGenerations(nodes, edges);
  for (const n of nodes) {
    const gen = (n.data as { generation?: number } | undefined)?.generation ?? fallbackGen.get(n.id) ?? 0;
    if (!byGen.has(gen)) byGen.set(gen, []);
    byGen.get(gen)!.push(n);
  }

  const posById = new Map<string, { x: number; y: number }>();
  const sortedGens = [...byGen.keys()].sort((a, b) => a - b);
  let prevOuterRadius = 0;

  for (const gen of sortedGens) {
    const members = byGen.get(gen)!;
    // Widest member on this ring drives the required spacing.
    const maxW = Math.max(...members.map((m) => nodeSize(m).width));
    const maxH = Math.max(...members.map((m) => nodeSize(m).height));

    if (gen === 0) {
      if (members.length === 1) {
        posById.set(members[0].id, { x: 0, y: 0 });
        prevOuterRadius = nodeSize(members[0]).width / 2;
      } else {
        const minChord = maxW + MIN_GAP;
        const r = minChord / (2 * Math.sin(Math.PI / members.length));
        members.forEach((m, i) => {
          const theta = (i / members.length) * Math.PI * 2;
          posById.set(m.id, { x: Math.cos(theta) * r, y: Math.sin(theta) * r });
        });
        prevOuterRadius = r + maxW / 2;
      }
      continue;
    }
    const count = members.length;
    // Siblings on the same ring must still clear each other (MIN_GAP is the
    // contract we honor everywhere). The radial distance between rings is
    // user-configurable via `ringGaps` — index (gen-1) controls the pad
    // between the parent ring and this one.
    const gaps = ringGaps && ringGaps.length > 0 ? ringGaps : [120, 80];
    const ringPad = ringGapForGen(gaps, gen);
    const minChord = maxW + MIN_GAP;
    const chordRadius = count >= 2 ? minChord / (2 * Math.sin(Math.PI / count)) : 0;
    const ringStep = maxH + ringPad;
    const minRingRadius = prevOuterRadius + ringStep;
    const r = Math.max(minRingRadius, chordRadius);
    members.forEach((m, i) => {
      const theta = (i / count) * Math.PI * 2 - Math.PI / 2;
      posById.set(m.id, { x: Math.cos(theta) * r, y: Math.sin(theta) * r });
    });
    // Next ring starts beyond this node's outer edge + half of MIN_GAP so the
    // box stays clear; the `ringPad` above controls how much *further* away
    // the next ring sits.
    prevOuterRadius = r + maxH / 2 + MIN_GAP / 2;
  }
  return nodes.map((n) => ({ ...n, position: posById.get(n.id) ?? n.position }));
}

function computeGenerations(nodes: Node[], edges: Edge[]): Map<string, number> {
  const adj = new Map<string, string[]>();
  const indeg = new Map<string, number>();
  for (const n of nodes) {
    adj.set(n.id, []);
    indeg.set(n.id, 0);
  }
  for (const e of edges) {
    adj.get(e.source)?.push(e.target);
    indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1);
  }
  const gen = new Map<string, number>();
  const queue: string[] = [];
  for (const [id, d] of indeg) {
    if (d === 0) {
      gen.set(id, 0);
      queue.push(id);
    }
  }
  while (queue.length) {
    const u = queue.shift()!;
    for (const v of adj.get(u) ?? []) {
      const ng = (gen.get(u) ?? 0) + 1;
      if (!gen.has(v) || gen.get(v)! < ng) gen.set(v, ng);
      indeg.set(v, (indeg.get(v) ?? 0) - 1);
      if ((indeg.get(v) ?? 0) === 0) queue.push(v);
    }
  }
  return gen;
}

/**
 * Iteratively nudge nodes apart until no two bounding boxes overlap.
 * Uses each node's measured size when available.
 */
export function resolveOverlaps<N extends Node>(nodes: N[]): N[] {
  if (nodes.length < 2) return nodes;
  const positions = nodes.map((n) => ({ ...n.position }));
  const sizes = nodes.map((n) => nodeSize(n));
  const maxIter = 60;

  for (let iter = 0; iter < maxIter; iter++) {
    let moved = false;
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const a = positions[i];
        const b = positions[j];
        const halfW = (sizes[i].width + sizes[j].width) / 2 + MIN_GAP / 2;
        const halfH = (sizes[i].height + sizes[j].height) / 2 + MIN_GAP / 2;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const overlapX = halfW - Math.abs(dx);
        const overlapY = halfH - Math.abs(dy);
        if (overlapX > 0 && overlapY > 0) {
          if (overlapX < overlapY) {
            const sign = dx === 0 ? (i < j ? -1 : 1) : Math.sign(dx);
            const shift = (overlapX + 1) / 2;
            a.x -= sign * shift;
            b.x += sign * shift;
          } else {
            const sign = dy === 0 ? (i < j ? -1 : 1) : Math.sign(dy);
            const shift = (overlapY + 1) / 2;
            a.y -= sign * shift;
            b.y += sign * shift;
          }
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  return nodes.map((n, i) => ({ ...n, position: positions[i] }));
}

export type PlacedBox = { x: number; y: number; width: number; height: number };

/**
 * Find a non-overlapping position near `preferred` for a new node whose
 * bounding box is `newSize`. Existing occupants are given with their own
 * per-node size. Walks an outward spiral until the box is clear.
 */
export function findFreePosition(
  preferred: { x: number; y: number },
  newSize: Size,
  existing: PlacedBox[],
): { x: number; y: number } {
  const collides = (p: { x: number; y: number }) =>
    existing.some((e) => {
      const halfW = (newSize.width + e.width) / 2 + MIN_GAP / 2;
      const halfH = (newSize.height + e.height) / 2 + MIN_GAP / 2;
      return Math.abs(e.x - p.x) < halfW && Math.abs(e.y - p.y) < halfH;
    });
  if (!collides(preferred)) return preferred;
  const step = Math.max(newSize.width, newSize.height) / 2 + MIN_GAP;
  for (let ring = 1; ring < 40; ring++) {
    const samples = Math.max(8, ring * 6);
    for (let k = 0; k < samples; k++) {
      const theta = (k / samples) * Math.PI * 2;
      const cand = {
        x: preferred.x + Math.cos(theta) * step * ring,
        y: preferred.y + Math.sin(theta) * step * ring,
      };
      if (!collides(cand)) return cand;
    }
  }
  return preferred;
}
