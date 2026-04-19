"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Edge, Node, NodeChange, EdgeChange, Connection } from "@xyflow/react";
import { applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import type { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { createMindmapDoc, type MindmapDoc } from "@/lib/yjs/doc";
import {
  addEdge as addEdgeY,
  appendNodesAndEdges,
  bulkReplace,
  deleteEdge as deleteEdgeY,
  deleteNode as deleteNodeY,
  loadSnapshot,
  readAllFromY,
  updateNodePosition,
  updateNodeWord,
  type WordNodeData,
} from "@/lib/yjs/binding";
import { createProvider } from "@/lib/yjs/provider";
import type { Snapshot } from "@/lib/storage/localDraft";

export type UseMindmapOpts = {
  roomId: string;
  enableCollab: boolean;
  initialSnapshot?: Snapshot | null;
};

export function useMindmap({ roomId, enableCollab, initialSnapshot }: UseMindmapOpts) {
  const docRef = useRef<MindmapDoc | null>(null);
  if (!docRef.current) docRef.current = createMindmapDoc();
  const doc = docRef.current;

  const [nodes, setNodes] = useState<Node<WordNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [providerReady, setProviderReady] = useState(false);
  const providerRef = useRef<WebsocketProvider | null>(null);

  // UndoManager tracks local edits on the node/edge/meta maps.
  const undoManagerRef = useRef<Y.UndoManager | null>(null);
  if (!undoManagerRef.current) {
    undoManagerRef.current = new Y.UndoManager(
      [doc.yNodes, doc.yEdges, doc.yMeta],
      { captureTimeout: 300 },
    );
  }
  const undo = useCallback(() => undoManagerRef.current?.undo(), []);
  const redo = useCallback(() => undoManagerRef.current?.redo(), []);

  // Initial snapshot load (runs before any Y.Doc sync)
  useEffect(() => {
    if (initialSnapshot) {
      loadSnapshot(doc, initialSnapshot);
      const { nodes: n, edges: e } = readAllFromY(doc);
      setNodes(n);
      setEdges(e);
    }
  }, [doc, initialSnapshot]);

  // Collab provider
  useEffect(() => {
    if (!enableCollab) return;
    const provider = createProvider(roomId, doc.ydoc);
    providerRef.current = provider;
    const handleStatus = ({ status }: { status: string }) => {
      setProviderReady(status === "connected");
    };
    provider.on("status", handleStatus);
    return () => {
      provider.off("status", handleStatus);
      provider.destroy();
      providerRef.current = null;
    };
  }, [enableCollab, roomId, doc.ydoc]);

  // Sync Y.Doc → React state
  useEffect(() => {
    const onChange = () => {
      const { nodes: n, edges: e } = readAllFromY(doc);
      setNodes(n);
      setEdges(e);
    };
    doc.yNodes.observe(onChange);
    doc.yEdges.observe(onChange);
    onChange();
    return () => {
      doc.yNodes.unobserve(onChange);
      doc.yEdges.unobserve(onChange);
    };
  }, [doc]);

  // React Flow → Y.Doc
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((prev) => applyNodeChanges(changes, prev) as Node<WordNodeData>[]);
      for (const c of changes) {
        if (c.type === "position" && c.position && c.dragging === false) {
          updateNodePosition(doc, c.id, c.position);
        } else if (c.type === "remove") {
          deleteNodeY(doc, c.id);
        }
      }
    },
    [doc],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((prev) => applyEdgeChanges(changes, prev));
      for (const c of changes) {
        if (c.type === "remove") deleteEdgeY(doc, c.id);
      }
    },
    [doc],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target) return;
      addEdgeY(doc, c.source, c.target);
    },
    [doc],
  );

  const renameNode = useCallback(
    (id: string, word: string) => {
      updateNodeWord(doc, id, word);
    },
    [doc],
  );

  const replaceAll = useCallback(
    (
      next: { nodes: Node<WordNodeData>[]; edges: Edge[] },
      meta?: { title?: string; rootWord?: string | null; layout?: string },
    ) => {
      bulkReplace(doc, next.nodes, next.edges, meta);
    },
    [doc],
  );

  const appendChildren = useCallback(
    (next: { nodes: Node<WordNodeData>[]; edges: Edge[] }) => {
      appendNodesAndEdges(doc, next.nodes, next.edges);
    },
    [doc],
  );

  const api = useMemo(
    () => ({
      nodes,
      edges,
      onNodesChange,
      onEdgesChange,
      onConnect,
      renameNode,
      replaceAll,
      appendChildren,
      doc,
      provider: providerRef,
      providerReady,
      undo,
      redo,
    }),
    [nodes, edges, onNodesChange, onEdgesChange, onConnect, renameNode, replaceAll, appendChildren, doc, providerReady, undo, redo],
  );

  return api;
}
