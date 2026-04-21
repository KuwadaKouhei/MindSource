"use client";

import { useState, type ReactNode } from "react";
import type { Settings } from "@/lib/settings/schema";
import { Logo } from "@/components/ui/primitives/Logo";
import { Glyph } from "@/components/ui/primitives/Glyph";
import { Button } from "@/components/ui/primitives/Button";

type Props = {
  title: string;
  onTitleChange: (t: string) => void;
  onCascade: (word: string) => void;
  onExpandSelected: () => void;
  onReLayout: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onShare: () => void;
  onSave?: () => void;
  saveState?: "idle" | "saving" | "saved" | "error";
  autoMode: Settings["auto_mode"];
  selectedId: string | null;
  loading: boolean;
  onToggleTree: () => void;
  treeOpen: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onCollaborators?: () => void;
  presence?: ReactNode;
};

export function Toolbar(p: Props) {
  const [seed, setSeed] = useState("");
  const unsaved = p.saveState === "saving" || p.saveState === "error";

  return (
    <div
      className="mono"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        height: 52,
        padding: "0 14px",
        background: "var(--bg2)",
        borderBottom: "1px solid var(--line)",
        fontSize: 12,
        overflow: "hidden",
      }}
    >
      {/* Logo group */}
      <Group>
        <Logo size="sm" />
        <span
          className="mono cursor-blink"
          style={{ fontSize: 12, letterSpacing: 1.4, fontWeight: 700 }}
        >
          MS
        </span>
      </Group>

      {/* Document group */}
      <Group>
        <Button
          variant={p.treeOpen ? "tb-active" : "tb-icon"}
          onClick={p.onToggleTree}
          title="ツリー表示 (T)"
          aria-label="toggle tree"
        >
          <Glyph name="listTree" size={14} />
        </Button>
        <div
          className="clip-notch-sm"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "0 10px",
            height: 28,
            background: "var(--bg3)",
            border: "1px solid var(--line2)",
            minWidth: 180,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 9999,
              background: unsaved ? "var(--amber)" : "var(--cyan-dim)",
              boxShadow: unsaved ? "0 0 6px var(--amber)" : "none",
              animation: unsaved ? "pulse 1.5s ease-in-out infinite" : undefined,
              flexShrink: 0,
            }}
          />
          <input
            value={p.title}
            onChange={(e) => p.onTitleChange(e.target.value)}
            placeholder="Untitled"
            style={{
              flex: 1,
              minWidth: 0,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text)",
              fontSize: 12,
              fontFamily: "var(--font-noto)",
            }}
          />
        </div>
      </Group>

      {/* AI group */}
      <Group>
        <div
          className="clip-notch-sm"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0,
            height: 28,
            background: "var(--bg3)",
            border: "1px solid var(--line2)",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 22,
              color: "var(--cyan)",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            $
          </span>
          <input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="起点ワード"
            onKeyDown={(e) => {
              if (e.key === "Enter" && seed.trim()) p.onCascade(seed.trim());
            }}
            style={{
              width: 120,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text)",
              fontSize: 12,
            }}
          />
        </div>
        <Button
          variant="tb-active"
          onClick={() => seed.trim() && p.onCascade(seed.trim())}
          disabled={p.loading || !seed.trim()}
          title="自動生成 (cascade)"
        >
          <Glyph name="sparkles" size={13} />
          {p.loading ? "gen…" : "cascade"}
        </Button>
        <Button
          variant="tb"
          onClick={p.onExpandSelected}
          disabled={p.loading || !p.selectedId}
          title="選択ノードから1世代展開"
        >
          <Glyph name="plus" size={13} />
          expand
        </Button>
        <Button variant="tb-icon" onClick={p.onReLayout} title="再レイアウト">
          <Glyph name="refresh" size={13} />
        </Button>
      </Group>

      {/* History */}
      <Group>
        <Button variant="tb-icon" onClick={p.onUndo} title="元に戻す (Ctrl+Z)">
          <Glyph name="undo" size={14} />
        </Button>
        <Button variant="tb-icon" onClick={p.onRedo} title="やり直し (Ctrl+Shift+Z)">
          <Glyph name="redo" size={14} />
        </Button>
      </Group>

      <div style={{ flex: 1 }} />

      {/* Presence */}
      {p.presence && <Group>{p.presence}</Group>}

      {/* Export group */}
      <Group last>
        {p.onSave && (
          <Button variant="tb" onClick={p.onSave}>
            {p.saveState === "saving" ? "saving…" : p.saveState === "saved" ? "saved" : "save"}
          </Button>
        )}
        <Button variant="tb" onClick={p.onExportPng} title="PNG">
          <Glyph name="download" size={13} /> PNG
        </Button>
        <Button variant="tb" onClick={p.onExportSvg} title="SVG">
          <Glyph name="download" size={13} /> SVG
        </Button>
        {p.onCollaborators && (
          <Button variant="tb" onClick={p.onCollaborators} title="メンバー">
            members
          </Button>
        )}
        <Button variant="tb-active" onClick={p.onShare} title="共有">
          <Glyph name="diamond" size={12} />
          share
        </Button>
      </Group>
    </div>
  );
}

function Group({ children, last = false }: { children: ReactNode; last?: boolean }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: "100%",
        padding: "0 12px",
        borderRight: last ? "none" : "1px solid var(--line)",
      }}
    >
      {children}
    </div>
  );
}
