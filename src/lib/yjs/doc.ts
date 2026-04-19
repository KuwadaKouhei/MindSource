import * as Y from "yjs";

export type YNodeValue = {
  id: string;
  word: string;
  generation: number;
  score: number | null;
  position: { x: number; y: number };
};

export type YEdgeValue = {
  id: string;
  source: string;
  target: string;
  score: number | null;
};

export type YMetaValue = string | number | null;

export function createMindmapDoc() {
  const ydoc = new Y.Doc();
  const yNodes = ydoc.getMap<YNodeValue>("nodes");
  const yEdges = ydoc.getMap<YEdgeValue>("edges");
  const yMeta = ydoc.getMap<YMetaValue>("meta");
  return { ydoc, yNodes, yEdges, yMeta };
}

export type MindmapDoc = ReturnType<typeof createMindmapDoc>;
