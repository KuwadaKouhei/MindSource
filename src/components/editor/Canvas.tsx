"use client";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useNodesInitialized,
  useReactFlow,
  type Node,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toPng, toSvg } from "html-to-image";
import { useMindmap } from "@/hooks/useMindmap";
import { useAutoGen } from "@/hooks/useAutoGen";
import { WordNode } from "@/components/flow/WordNode";
import { Toolbar } from "./Toolbar";
import { NodeInspector } from "./NodeInspector";
import { PresenceBar } from "./PresenceBar";
import { TreePanel } from "./TreePanel";
import { RemoteCursors } from "./RemoteCursors";
import { useToast } from "@/components/ui/Toaster";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CollaboratorsModal } from "./CollaboratorsModal";
import { ColorSchemeContext } from "@/components/flow/ColorSchemeContext";
import { colorForGen } from "@/lib/flow/colors";
import {
  runLayout,
  findFreePosition,
  nodeSize,
  type PlacedBox,
} from "@/components/layout/LayoutRunner";
import type { Settings } from "@/lib/settings/schema";
import type { Snapshot } from "@/lib/storage/localDraft";
import type { WordNodeData } from "@/lib/yjs/binding";
import { readAllFromY } from "@/lib/yjs/binding";
import { addChildNode } from "@/lib/yjs/binding";
import {
  createMindmapDocHandle,
  type NodeRenameDetail,
} from "@/lib/yjs/nodeRenameBridge";

const nodeTypes = { word: WordNode };

export type CanvasProps = {
  roomId: string;
  enableCollab: boolean;
  initialSnapshot: Snapshot | null;
  initialTitle: string;
  settings: Settings;
  onSnapshotChange?: (snapshot: Snapshot) => void;
  onTitleChange?: (title: string) => void;
  saveState?: "idle" | "saving" | "saved" | "error";
  onSave?: () => void;
  autoSeedWord?: string | null;
  /** Supabase map id when saved; otherwise undefined (anonymous). */
  savedMapId?: string | null;
};

export function Canvas(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}

function CanvasInner({
  roomId,
  enableCollab,
  initialSnapshot,
  initialTitle,
  settings,
  onSnapshotChange,
  onTitleChange,
  saveState,
  onSave,
  autoSeedWord,
  savedMapId,
}: CanvasProps) {
  const rf = useReactFlow();
  const toast = useToast();
  const mm = useMindmap({ roomId, enableCollab, initialSnapshot });
  const nodesInitialized = useNodesInitialized();
  // Keep a live ref to mm.nodes so callbacks can read the latest measured sizes
  // without needing to be recreated on every render.
  const nodesRef = useRef(mm.nodes);
  useEffect(() => {
    nodesRef.current = mm.nodes;
  }, [mm.nodes]);
  const getMeasuredNodes = useCallback(() => nodesRef.current, []);

  const { cascadeFromRoot, expandNode, loading } = useAutoGen({
    doc: mm.doc,
    settings,
    replaceAll: mm.replaceAll,
    appendChildren: mm.appendChildren,
    getMeasuredNodes,
    onError: (err, ctx) => {
      const offline = err.message.toLowerCase().includes("failed to fetch") ||
        err.message.toLowerCase().includes("networkerror");
      toast.show({
        kind: "error",
        title: ctx === "cascade" ? "自動生成に失敗" : "連想取得に失敗",
        message: offline
          ? "word-api に接続できません。サーバーが起動しているか確認してください。"
          : err.message,
      });
    },
  });

  const [title, setTitle] = useState(initialTitle);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [treeOpen, setTreeOpen] = useState(false);
  const [collabOpen, setCollabOpen] = useState(false);

  const focusNode = useCallback(
    (id: string) => {
      setSelectedId(id);
      const n = nodesRef.current.find((x) => x.id === id);
      if (n) {
        rf.setCenter(n.position.x, n.position.y, { zoom: 1.2, duration: 400 });
      }
    },
    [rf],
  );

  const selectedNode = useMemo(
    () => mm.nodes.find((n) => n.id === selectedId) ?? null,
    [mm.nodes, selectedId],
  );

  // Emit snapshot for debounced persistence (2s)
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!onSnapshotChange) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const viewport = rf.getViewport?.() ?? null;
      onSnapshotChange({ nodes: mm.nodes, edges: mm.edges, viewport });
    }, 2000);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [mm.nodes, mm.edges, onSnapshotChange, rf]);

  const handleTitle = useCallback(
    (t: string) => {
      setTitle(t);
      onTitleChange?.(t);
    },
    [onTitleChange],
  );

  const handleReLayout = useCallback(async () => {
    const { nodes: yNodesArr, edges: e } = readAllFromY(mm.doc);
    // Merge measured sizes from React Flow state into the Yjs-derived nodes
    // so the layout engine reasons about real widths/heights.
    const measured = new Map(nodesRef.current.map((n) => [n.id, n] as const));
    const withMeasured = yNodesArr.map((n) => {
      const rfNode = measured.get(n.id) as (Node<WordNodeData> & { measured?: { width: number; height: number } }) | undefined;
      return rfNode?.measured ? { ...n, measured: rfNode.measured } : n;
    });
    const laid = await runLayout(withMeasured, e, settings.layout, {
      ringGaps: settings.ring_gaps,
    });
    // Strip the measured field before writing back to Y.Doc — only position is stored.
    mm.replaceAll(
      { nodes: laid.map(({ measured: _m, ...rest }) => rest) as Node<WordNodeData>[], edges: e },
      { layout: settings.layout },
    );
  }, [mm, settings.layout]);

  const handleAddChild = useCallback(
    (parentId: string) => {
      const parent = mm.doc.yNodes.get(parentId);
      if (!parent) return;
      const measuredById = new Map(nodesRef.current.map((n) => [n.id, nodeSize(n)] as const));
      const existing: PlacedBox[] = [];
      mm.doc.yNodes.forEach((n) => {
        const s = measuredById.get(n.id) ?? nodeSize({ id: n.id, position: n.position, data: {} } as Node);
        existing.push({ x: n.position.x, y: n.position.y, ...s });
      });
      const preferred = {
        x: parent.position.x,
        y: parent.position.y + 110,
      };
      const newSize = measuredById.get(parentId) ?? nodeSize({ id: parentId, position: parent.position, data: {} } as Node);
      const pos = findFreePosition(preferred, newSize, existing);
      addChildNode(mm.doc, parentId, "新しいノード", pos);
    },
    [mm.doc],
  );

  // After cascade / bulk operations, once nodes finish measuring, re-run the
  // layout so collision handling uses real widths rather than defaults.
  const pendingRelayoutRef = useRef(false);
  const wrappedCascade = useCallback(
    async (word: string) => {
      pendingRelayoutRef.current = true;
      await cascadeFromRoot(word);
    },
    [cascadeFromRoot],
  );
  useEffect(() => {
    if (!pendingRelayoutRef.current) return;
    if (!nodesInitialized) return;
    if (mm.nodes.length === 0) return;
    pendingRelayoutRef.current = false;
    void handleReLayout();
  }, [nodesInitialized, mm.nodes.length, handleReLayout]);

  // Populate awareness with logged-in user's display name when available.
  useEffect(() => {
    const provider = mm.provider.current;
    if (!provider) return;
    const applyName = (name: string) => {
      const existing = provider.awareness.getLocalState() as { user?: { name: string; color: string; id: number } } | null;
      const current = existing?.user;
      const color = current?.color ?? `hsl(${Math.floor(Math.random() * 360)} 70% 60%)`;
      provider.awareness.setLocalStateField("user", {
        id: provider.awareness.clientID,
        name,
        color,
      });
    };
    (async () => {
      try {
        const res = await fetch("/api/profile", { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as { display_name?: string | null };
        if (data.display_name) applyName(data.display_name);
      } catch {
        /* anonymous session */
      }
    })();
  }, [mm.provider, mm.providerReady]);

  // WordNode → rename event → Y.Doc
  useEffect(() => {
    const onRename = (ev: Event) => {
      const detail = (ev as CustomEvent<NodeRenameDetail>).detail;
      if (!detail) return;
      mm.renameNode(detail.id, detail.word);
    };
    window.addEventListener(createMindmapDocHandle.RENAME_EVENT, onRename);
    return () => window.removeEventListener(createMindmapDocHandle.RENAME_EVENT, onRename);
  }, [mm]);

  // Keyboard shortcuts: Ctrl/Cmd+Z = undo, Ctrl/Cmd+Shift+Z or Ctrl+Y = redo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      // Skip when typing in an input/textarea
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
        return;
      }
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        mm.undo();
      } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        e.preventDefault();
        mm.redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mm]);

  // Auto-run cascade once if a seed word was supplied and the map is empty
  const autoSeedFiredRef = useRef(false);
  useEffect(() => {
    if (autoSeedFiredRef.current) return;
    if (!autoSeedWord) return;
    if (mm.doc.yNodes.size > 0) {
      autoSeedFiredRef.current = true;
      return;
    }
    autoSeedFiredRef.current = true;
    wrappedCascade(autoSeedWord);
  }, [autoSeedWord, wrappedCascade, mm.doc]);

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const pendingDeleteNode = useMemo(
    () => mm.nodes.find((n) => n.id === pendingDelete) ?? null,
    [mm.nodes, pendingDelete],
  );
  const handleDelete = useCallback((id: string) => setPendingDelete(id), []);
  const confirmDelete = useCallback(() => {
    if (!pendingDelete) return;
    mm.onNodesChange([{ type: "remove", id: pendingDelete }]);
    if (selectedId === pendingDelete) setSelectedId(null);
    setPendingDelete(null);
  }, [pendingDelete, mm, selectedId]);

  const captureViewport = useCallback(async (kind: "png" | "svg") => {
    const vp = document.querySelector<HTMLElement>(".react-flow__viewport");
    if (!vp) return;
    // fit view first for a cleaner capture
    rf.fitView({ padding: 0.1, duration: 0 });
    await new Promise((r) => requestAnimationFrame(r));
    const filter = (n: HTMLElement) => !n.classList?.contains?.("react-flow__minimap") && !n.classList?.contains?.("react-flow__controls");
    const dataUrl = kind === "png" ? await toPng(vp, { filter, backgroundColor: "#0b0d12" }) : await toSvg(vp, { filter, backgroundColor: "#0b0d12" });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${title || "mindmap"}.${kind}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [rf, title]);

  const handleShare = useCallback(() => {
    const url = new URL(window.location.href);
    navigator.clipboard
      ?.writeText(url.toString())
      .then(() =>
        toast.show({
          kind: "success",
          title: "共有URLをコピーしました",
          message: "他の人に送るとリアルタイム共同編集できます。",
        }),
      )
      .catch(() =>
        toast.show({
          kind: "warning",
          title: "クリップボードに書き込めませんでした",
          message: url.toString(),
        }),
      );
  }, [toast]);

  return (
    <ColorSchemeContext.Provider value={settings.color_scheme}>
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Toolbar
        title={title}
        onTitleChange={handleTitle}
        onCascade={wrappedCascade}
        onExpandSelected={() => selectedId && expandNode(selectedId)}
        onReLayout={handleReLayout}
        onExportPng={() => captureViewport("png")}
        onExportSvg={() => captureViewport("svg")}
        onShare={handleShare}
        onSave={onSave}
        saveState={saveState}
        autoMode={settings.auto_mode}
        selectedId={selectedId}
        loading={loading}
        onToggleTree={() => setTreeOpen((v) => !v)}
        treeOpen={treeOpen}
        onUndo={mm.undo}
        onRedo={mm.redo}
        onCollaborators={savedMapId ? () => setCollabOpen(true) : undefined}
      />
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {treeOpen && (
          <TreePanel
            nodes={mm.nodes}
            edges={mm.edges}
            selectedId={selectedId}
            onSelect={focusNode}
            onClose={() => setTreeOpen(false)}
          />
        )}
        <div style={{ flex: 1, position: "relative" }}>
          <ReactFlow
            nodes={mm.nodes}
            edges={mm.edges}
            nodeTypes={nodeTypes}
            onNodesChange={mm.onNodesChange}
            onEdgesChange={mm.onEdgesChange}
            onConnect={mm.onConnect}
            onNodeClick={(_, n: Node) => {
              setSelectedId(n.id);
            }}
            onPaneClick={() => setSelectedId(null)}
            fitView
            proOptions={{ hideAttribution: true }}
            deleteKeyCode={null}
          >
            <Background gap={24} />
            <MiniMap
              pannable
              zoomable
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
              maskColor="rgba(11, 13, 18, 0.6)"
              nodeColor={(n) => {
                const gen = (n.data as { generation?: number } | undefined)?.generation ?? 0;
                return colorForGen(settings.color_scheme, gen);
              }}
              nodeStrokeColor="rgba(255,255,255,0.35)"
              nodeStrokeWidth={2}
              nodeBorderRadius={6}
            />
            <Controls />
            <RemoteCursors provider={mm.provider.current} />
          </ReactFlow>
          <div style={{ position: "absolute", top: 8, right: 8 }}>
            <PresenceBar provider={mm.provider.current} />
          </div>
        </div>
        <NodeInspector
          node={selectedNode}
          onRename={mm.renameNode}
          onDelete={handleDelete}
          onAddChild={handleAddChild}
          onExpand={expandNode}
          expanding={loading}
        />
      </div>
      {savedMapId && (
        <CollaboratorsModal
          open={collabOpen}
          onClose={() => setCollabOpen(false)}
          mapId={savedMapId}
        />
      )}
      <ConfirmDialog
        open={pendingDelete !== null}
        title="ノードを削除しますか？"
        message={
          pendingDeleteNode
            ? `「${(pendingDeleteNode.data as { word?: string })?.word ?? pendingDelete}」と、このノードに繋がっているエッジを削除します。`
            : ""
        }
        confirmLabel="削除"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
    </ColorSchemeContext.Provider>
  );
}
