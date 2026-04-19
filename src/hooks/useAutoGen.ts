"use client";

import { useCallback, useState } from "react";
import type { Node } from "@xyflow/react";
import { searchCascade, searchRelated } from "@/lib/word-api/client";
import { cascadeToFlow, relatedToChildren } from "@/lib/flow/convert";
import { runLayout, nodeSize, type PlacedBox } from "@/components/layout/LayoutRunner";
import type { Settings } from "@/lib/settings/schema";
import type { MindmapDoc } from "@/lib/yjs/doc";
import { readAllFromY, type WordNodeData } from "@/lib/yjs/binding";

type Opts = {
  doc: MindmapDoc;
  settings: Settings;
  replaceAll: (
    g: Parameters<ReturnType<typeof import("./useMindmap").useMindmap>["replaceAll"]>[0],
    meta?: { title?: string; rootWord?: string | null; layout?: string },
  ) => void;
  appendChildren: (
    g: Parameters<ReturnType<typeof import("./useMindmap").useMindmap>["appendChildren"]>[0],
  ) => void;
  /** Latest measured React Flow nodes, for size-aware layout. */
  getMeasuredNodes: () => Node<WordNodeData>[];
  onError?: (err: Error, context: "cascade" | "expand") => void;
};

export function useAutoGen({ doc, settings, replaceAll, appendChildren, getMeasuredNodes, onError }: Opts) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cascadeFromRoot = useCallback(
    async (word: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await searchCascade({
          word,
          depth: settings.depth,
          top_k: settings.top_k,
          min_score: settings.min_score,
          pos: settings.pos,
          exclude: settings.exclude,
          use_stopwords: settings.use_stopwords,
          max_nodes: settings.max_nodes,
        });
        const { nodes, edges } = cascadeToFlow(res);
        const laidOut = await runLayout(nodes, edges, settings.layout, {
          ringGaps: settings.ring_gaps,
        });
        replaceAll({ nodes: laidOut, edges }, { rootWord: word, layout: settings.layout });
      } catch (e) {
        const err = e as Error;
        setError(err.message);
        onError?.(err, "cascade");
      } finally {
        setLoading(false);
      }
    },
    [settings, replaceAll, onError],
  );

  const expandNode = useCallback(
    async (nodeId: string) => {
      const y = doc.yNodes.get(nodeId);
      if (!y) return;
      setLoading(true);
      setError(null);
      try {
        const { nodes: currentNodes } = readAllFromY(doc);
        const existingIds = new Set(currentNodes.map((n) => n.id));
        const existingWords = new Set(currentNodes.map((n) => (n.data as { word: string }).word));
        // Use measured sizes from React Flow when available; otherwise fall back
        // to defaults (findFreePosition handles both paths).
        const measuredById = new Map(
          getMeasuredNodes().map((n) => [n.id, nodeSize(n)] as const),
        );
        const existingBoxes: PlacedBox[] = currentNodes.map((n) => ({
          x: n.position.x,
          y: n.position.y,
          ...(measuredById.get(n.id) ?? nodeSize(n)),
        }));
        const exclude = Array.from(new Set([...settings.exclude, ...existingWords, y.word]));
        const res = await searchRelated({
          word: y.word,
          top_k: settings.top_k,
          min_score: settings.min_score,
          pos: settings.pos,
          exclude,
          use_stopwords: settings.use_stopwords,
        });
        const { nodes, edges } = relatedToChildren(
          nodeId,
          y.generation,
          y.position,
          res,
          existingIds,
          existingBoxes,
        );
        appendChildren({ nodes, edges });
      } catch (e) {
        const err = e as Error;
        setError(err.message);
        onError?.(err, "expand");
      } finally {
        setLoading(false);
      }
    },
    [doc, settings, appendChildren, getMeasuredNodes, onError],
  );

  return { cascadeFromRoot, expandNode, loading, error };
}
