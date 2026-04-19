"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  SETTINGS_LOCAL_KEY,
  safeParseSettings,
} from "@/lib/settings/defaults";
import type { Settings } from "@/lib/settings/schema";

const POS_OPTIONS = ["名詞", "動詞", "形容詞"];

export function SettingsForm({
  initial,
  persistRemote,
}: {
  initial: Settings;
  persistRemote: boolean;
}) {
  const [s, setS] = useState<Settings>(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [excludeInput, setExcludeInput] = useState("");

  // For anon users, hydrate from localStorage on mount
  useEffect(() => {
    if (persistRemote) return;
    try {
      const raw = localStorage.getItem(SETTINGS_LOCAL_KEY);
      if (raw) setS(safeParseSettings(JSON.parse(raw)));
    } catch {}
  }, [persistRemote]);

  const save = async (next: Settings) => {
    setState("saving");
    try {
      if (persistRemote) {
        const res = await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
        if (!res.ok) throw new Error("save failed");
      } else {
        localStorage.setItem(SETTINGS_LOCAL_KEY, JSON.stringify(next));
      }
      setState("saved");
      setTimeout(() => setState("idle"), 1500);
    } catch {
      setState("error");
    }
  };

  const patch = (p: Partial<Settings>) => {
    const next = { ...s, ...p };
    setS(next);
    save(next);
  };

  const togglePos = (p: string) => {
    const has = s.pos.includes(p);
    patch({ pos: has ? s.pos.filter((x) => x !== p) : [...s.pos, p] });
  };

  const addExclude = () => {
    const w = excludeInput.trim();
    if (!w || s.exclude.includes(w)) return;
    patch({ exclude: [...s.exclude, w] });
    setExcludeInput("");
  };

  const removeExclude = (w: string) => patch({ exclude: s.exclude.filter((x) => x !== w) });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Field label="自動生成モード">
        <Radio
          value={s.auto_mode}
          onChange={(v) => patch({ auto_mode: v as Settings["auto_mode"] })}
          options={[
            { v: "expand", l: "クリックで1世代展開 (expand)" },
            { v: "cascade", l: "最初の1語で一括生成 (cascade)" },
          ]}
        />
      </Field>

      <Field label="レイアウト">
        <Radio
          value={s.layout}
          onChange={(v) => patch({ layout: v as Settings["layout"] })}
          options={[
            { v: "hierarchical", l: "樹形図 (階層)" },
            { v: "radial", l: "放射状" },
            { v: "generation", l: "世代ごと色分け" },
          ]}
        />
      </Field>

      <Row>
        <Field label={`depth (世代数): ${s.depth}`}>
          <input
            type="range" min={1} max={4} value={s.depth}
            onChange={(e) => patch({ depth: Number(e.target.value) })}
            style={range()}
          />
        </Field>
        <Field label={`top_k (世代あたり件数): ${s.top_k}`}>
          <input
            type="range" min={1} max={30} value={s.top_k}
            onChange={(e) => patch({ top_k: Number(e.target.value) })}
            style={range()}
          />
        </Field>
      </Row>

      <Row>
        <Field label={`min_score (類似度閾値): ${s.min_score.toFixed(2)}`}>
          <input
            type="range" min={0} max={1} step={0.05} value={s.min_score}
            onChange={(e) => patch({ min_score: Number(e.target.value) })}
            style={range()}
          />
        </Field>
        <Field label={`max_nodes (最大ノード数): ${s.max_nodes}`}>
          <input
            type="range" min={10} max={500} step={10} value={s.max_nodes}
            onChange={(e) => patch({ max_nodes: Number(e.target.value) })}
            style={range()}
          />
        </Field>
      </Row>

      <Field label="世代間の距離">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "#9aa3b5", marginBottom: 4 }}>
              第2世代 (中心→外側) : {s.ring_gaps[0] ?? 40}px
            </div>
            <input
              type="range"
              min={0}
              max={200}
              step={2}
              value={s.ring_gaps[0] ?? 40}
              onChange={(e) => {
                const next = [...s.ring_gaps];
                next[0] = Number(e.target.value);
                patch({ ring_gaps: next });
              }}
              style={range()}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#9aa3b5", marginBottom: 4 }}>
              第3世代以降 : {s.ring_gaps[1] ?? s.ring_gaps[0] ?? 12}px
            </div>
            <input
              type="range"
              min={0}
              max={200}
              step={2}
              value={s.ring_gaps[1] ?? s.ring_gaps[0] ?? 12}
              onChange={(e) => {
                const next = [...s.ring_gaps];
                if (next.length < 2) next.push(0);
                next[1] = Number(e.target.value);
                patch({ ring_gaps: next });
              }}
              style={range()}
            />
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#7a8190", marginTop: 6 }}>
          世代間の「追加余白」(px)。樹形図・放射どちらでも効きます。ノード同士が重ならない最小余白は別途確保されます。
        </div>
      </Field>

      <Field label="品詞フィルタ">
        <div style={{ display: "flex", gap: 12 }}>
          {POS_OPTIONS.map((p) => (
            <label key={p} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={s.pos.includes(p)} onChange={() => togglePos(p)} />
              {p}
            </label>
          ))}
        </div>
      </Field>

      <Field label="ストップワード">
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={s.use_stopwords}
            onChange={(e) => patch({ use_stopwords: e.target.checked })}
          />
          システム既定のストップワードを除外する
        </label>
      </Field>

      <Field label="除外語">
        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={excludeInput}
            onChange={(e) => setExcludeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addExclude();
            }}
            placeholder="追加する語"
            style={input()}
          />
          <button onClick={addExclude} style={btn()}>追加</button>
        </div>
        {s.exclude.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {s.exclude.map((w) => (
              <span key={w} style={chip()} onClick={() => removeExclude(w)} title="クリックで削除">
                {w} ✕
              </span>
            ))}
          </div>
        )}
      </Field>

      <div style={{ color: "#9aa3b5", fontSize: 12 }}>
        {state === "saving" && "保存中…"}
        {state === "saved" && "保存しました"}
        {state === "error" && "保存に失敗しました"}
        {state === "idle" && (persistRemote ? "変更は即座にアカウントへ保存されます" : "変更は即座にブラウザへ保存されます")}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 12, color: "#c5cad6", fontWeight: 500 }}>{label}</div>
      {children}
    </div>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>{children}</div>;
}
function Radio<T extends string>({
  value, onChange, options,
}: { value: T; onChange: (v: T) => void; options: { v: T; l: string }[] }) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {options.map((o) => (
        <label
          key={o.v}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: `1px solid ${value === o.v ? "var(--accent)" : "var(--border)"}`,
            background: value === o.v ? "var(--surface-2)" : "var(--surface)",
            cursor: "pointer",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <input
            type="radio"
            name="radio"
            checked={value === o.v}
            onChange={() => onChange(o.v)}
            style={{ display: "none" }}
          />
          {o.l}
        </label>
      ))}
    </div>
  );
}
function range(): React.CSSProperties { return { width: "100%" }; }
function input(): React.CSSProperties {
  return { flex: 1, padding: "7px 10px", borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: 13 };
}
function btn(): React.CSSProperties {
  return { padding: "7px 12px", borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)", cursor: "pointer", fontSize: 13 };
}
function chip(): React.CSSProperties {
  return { padding: "4px 8px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 9999, cursor: "pointer", fontSize: 12 };
}
