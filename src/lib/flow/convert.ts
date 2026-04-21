import type { Edge, Node } from "@xyflow/react";
import type { CascadeResponse, RelatedResponse } from "@/lib/relation-word-api/types";
import type { WordNodeData } from "@/lib/yjs/binding";
import {
  findFreePosition,
  DEFAULT_NODE_W,
  DEFAULT_NODE_H,
  MIN_GAP,
  type PlacedBox,
} from "@/components/layout/LayoutRunner";

export function cascadeToFlow(res: CascadeResponse): {
  nodes: Node<WordNodeData>[];
  edges: Edge[];
} {
  const nodes: Node<WordNodeData>[] = res.nodes.map((n) => ({
    id: n.id,
    type: "word",
    position: { x: 0, y: 0 },
    data: { word: n.word, generation: n.generation, score: n.score },
  }));
  const edges: Edge[] = res.edges.map((e) => ({
    id: `${e.from}->${e.to}`,
    source: e.from,
    target: e.to,
    type: "smoothstep",
    data: { score: e.score },
    style: { opacity: 0.35 + 0.65 * e.score },
  }));
  return { nodes, edges };
}

export function relatedToChildren(
  parentId: string,
  parentGeneration: number,
  parentPos: { x: number; y: number },
  res: RelatedResponse,
  existingIds: Set<string>,
  existingBoxes: PlacedBox[],
): { nodes: Node<WordNodeData>[]; edges: Edge[] } {
  const nodes: Node<WordNodeData>[] = [];
  const edges: Edge[] = [];
  const n = res.results.length;
  // Without the children rendered yet we don't know their width, so use the
  // fallback as an upper bound — it's good enough to pick a safe ring radius.
  const newSize = { width: DEFAULT_NODE_W, height: DEFAULT_NODE_H };
  const minChord = newSize.width + MIN_GAP;
  const radius = Math.max(140, n >= 2 ? minChord / (2 * Math.sin(Math.PI / n)) : 140);
  const placed: PlacedBox[] = [...existingBoxes];

  res.results.forEach((item, i) => {
    let id = `n_${item.word}`;
    let suffix = 1;
    while (existingIds.has(id)) {
      id = `n_${item.word}_${suffix++}`;
    }
    existingIds.add(id);
    const theta = (i / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
    const preferred = {
      x: parentPos.x + Math.cos(theta) * radius,
      y: parentPos.y + Math.sin(theta) * radius,
    };
    const position = findFreePosition(preferred, newSize, placed);
    placed.push({ ...position, ...newSize });
    nodes.push({
      id,
      type: "word",
      position,
      data: { word: item.word, generation: parentGeneration + 1, score: item.score },
    });
    edges.push({
      id: `${parentId}->${id}`,
      source: parentId,
      target: id,
      type: "smoothstep",
      data: { score: item.score },
      style: { opacity: 0.35 + 0.65 * item.score },
    });
  });
  return { nodes, edges };
}
