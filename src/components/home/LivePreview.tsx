"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Tag } from "@/components/ui/primitives/Tag";
import { LiveStatus } from "@/components/ui/primitives/LiveStatus";

const NS = "http://www.w3.org/2000/svg";

const WORD_MAP: Record<string, string[]> = {
  コーヒー: ["豆", "焙煎", "朝", "香り", "カフェ", "苦味", "ミルク", "ラテ"],
  東京: ["新宿", "渋谷", "夜景", "地下鉄", "下町", "タワー", "人混み", "雨"],
  宇宙: ["星", "銀河", "無重力", "光", "時間", "ブラックホール", "孤独", "生命"],
  記憶: ["思い出", "忘却", "香り", "子供", "音楽", "夢", "写真", "感情"],
  旅行: ["空港", "荷物", "地図", "写真", "出会い", "駅", "夜行", "自由"],
  音楽: ["リズム", "メロディ", "歌詞", "ライブ", "感情", "楽器", "録音", "沈黙"],
};

const GEN2: Record<string, string[]> = {
  豆: ["種", "挽く"],
  焙煎: ["煙", "熱"],
  香り: ["記憶", "鼻"],
  星: ["夜", "光"],
  銀河: ["渦", "距離"],
  思い出: ["涙", "幼少期"],
};

export type LivePreviewHandle = {
  regen: (seed: string) => void;
};

export const LivePreview = forwardRef<LivePreviewHandle>(function LivePreview(_, ref) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [seed, setSeed] = useState("コーヒー");
  const [nodeCount, setNodeCount] = useState(17);

  const draw = (word: string) => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.innerHTML = `
      <defs>
        <radialGradient id="gcenter" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#4fd1ff" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#4fd1ff" stop-opacity="0"/>
        </radialGradient>
      </defs>
    `;

    const cx = 450;
    const cy = 200;
    const primary = (WORD_MAP[word] || ["A", "B", "C", "D", "E", "F", "G", "H"]).slice(0, 8);
    const primaryNodes = primary.map((w, i) => {
      const a = (i / primary.length) * Math.PI * 2 - Math.PI / 2;
      return {
        x: cx + Math.cos(a) * 170,
        y: cy + Math.sin(a) * 140,
        label: w,
        delay: 0.08 * i,
      };
    });

    const secondary: { x: number; y: number; label: string; parent: typeof primaryNodes[number]; delay: number }[] = [];
    primaryNodes.slice(0, 3).forEach((p, pi) => {
      const kids = GEN2[p.label] || ["…", "…"];
      kids.forEach((c, ci) => {
        const a = Math.atan2(p.y - cy, p.x - cx) + (ci - 0.5) * 0.6;
        secondary.push({
          x: p.x + Math.cos(a) * 80,
          y: p.y + Math.sin(a) * 70,
          label: c,
          parent: p,
          delay: 0.8 + 0.1 * (pi * 2 + ci),
        });
      });
    });

    setNodeCount(1 + primaryNodes.length + secondary.length);

    const mkLine = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      delay: number,
      thin: boolean,
    ) => {
      const l = document.createElementNS(NS, "line");
      l.setAttribute("x1", String(x1));
      l.setAttribute("y1", String(y1));
      l.setAttribute("x2", String(x2));
      l.setAttribute("y2", String(y2));
      l.setAttribute("stroke", "#4fd1ff");
      l.setAttribute("stroke-width", thin ? "0.6" : "1");
      l.setAttribute("opacity", "0");
      l.setAttribute("stroke-dasharray", "3 3");
      l.style.filter = "drop-shadow(0 0 2px #4fd1ff)";
      l.style.animation = `lineFade 0.5s ease-out ${delay}s forwards, lineDash 1.5s linear ${delay + 0.5}s infinite`;
      return l;
    };

    const mkNode = (
      n: { x: number; y: number; label: string },
      isPrim: boolean,
      delay: number,
    ) => {
      const g = document.createElementNS(NS, "g");
      g.setAttribute("opacity", "0");
      g.setAttribute("transform", `translate(${n.x} ${n.y})`);
      g.style.transformBox = "fill-box";
      g.style.transformOrigin = "center";
      g.style.animation = `nodePop 0.5s cubic-bezier(.2,.7,.3,1.3) ${delay}s forwards`;
      const r = isPrim ? 36 : 26;
      const h = isPrim ? 28 : 22;
      const rect = document.createElementNS(NS, "rect");
      rect.setAttribute("x", String(-r));
      rect.setAttribute("y", String(-h / 2));
      rect.setAttribute("width", String(r * 2));
      rect.setAttribute("height", String(h));
      rect.setAttribute("fill", "#0e1628");
      rect.setAttribute("stroke", isPrim ? "#4fd1ff" : "#2a4066");
      rect.setAttribute("stroke-width", "1");
      if (isPrim) rect.style.filter = "drop-shadow(0 0 4px #4fd1ff)";
      const t = document.createElementNS(NS, "text");
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("dy", "4");
      t.setAttribute("font-family", "var(--font-noto), sans-serif");
      t.setAttribute("font-size", isPrim ? "13" : "11");
      t.setAttribute("font-weight", isPrim ? "700" : "500");
      t.setAttribute("fill", isPrim ? "#dfe8f5" : "#b5c5dd");
      t.textContent = n.label;
      g.appendChild(rect);
      g.appendChild(t);
      return g;
    };

    secondary.forEach((n) =>
      svg.appendChild(mkLine(n.parent.x, n.parent.y, n.x, n.y, n.delay - 0.1, true)),
    );
    primaryNodes.forEach((n) => svg.appendChild(mkLine(cx, cy, n.x, n.y, n.delay, false)));

    const halo = document.createElementNS(NS, "circle");
    halo.setAttribute("cx", String(cx));
    halo.setAttribute("cy", String(cy));
    halo.setAttribute("r", "60");
    halo.setAttribute("fill", "url(#gcenter)");
    halo.style.animation = "halopulse 2s ease-in-out infinite";
    halo.style.transformOrigin = `${cx}px ${cy}px`;
    svg.appendChild(halo);

    const centerG = document.createElementNS(NS, "g");
    centerG.setAttribute("transform", `translate(${cx} ${cy})`);
    const cc = document.createElementNS(NS, "circle");
    cc.setAttribute("r", "38");
    cc.setAttribute("fill", "#0a1020");
    cc.setAttribute("stroke", "#4fd1ff");
    cc.setAttribute("stroke-width", "1.5");
    cc.style.filter = "drop-shadow(0 0 10px #4fd1ff)";
    const ct = document.createElementNS(NS, "text");
    ct.setAttribute("text-anchor", "middle");
    ct.setAttribute("dy", "5");
    ct.setAttribute("font-family", "var(--font-noto), sans-serif");
    ct.setAttribute("font-size", "14");
    ct.setAttribute("font-weight", "700");
    ct.setAttribute("fill", "#4fd1ff");
    ct.textContent = word;
    centerG.appendChild(cc);
    centerG.appendChild(ct);
    svg.appendChild(centerG);

    primaryNodes.forEach((n) => svg.appendChild(mkNode(n, true, n.delay + 0.1)));
    secondary.forEach((n) => svg.appendChild(mkNode(n, false, n.delay + 0.05)));
  };

  useImperativeHandle(ref, () => ({
    regen: (w: string) => {
      setSeed(w);
      draw(w);
    },
  }));

  useEffect(() => {
    draw(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="corners clip-notch"
      style={{
        position: "relative",
        background: "var(--bg2)",
        border: "1px solid var(--line)",
        padding: "14px 14px 10px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <Tag>● {`network_synth.wasm`}</Tag>
        <div
          className="mono"
          style={{
            fontSize: 10,
            color: "var(--muted)",
            letterSpacing: 0.8,
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <span>
            nodes:{" "}
            <span style={{ color: "var(--cyan)" }}>{nodeCount}</span>
          </span>
          <span>·</span>
          <span>
            depth: <span style={{ color: "var(--cyan)" }}>2</span>
          </span>
          <span>·</span>
          <LiveStatus />
        </div>
      </div>
      <svg
        ref={svgRef}
        viewBox="0 0 900 420"
        width="100%"
        style={{ display: "block", height: "auto", aspectRatio: "900/420" }}
        preserveAspectRatio="xMidYMid meet"
      />
      <div
        className="mono"
        style={{
          position: "absolute",
          bottom: 10,
          left: 14,
          fontSize: 10,
          color: "var(--muted)",
          letterSpacing: 0.8,
        }}
      >
        seed:{" "}
        <span style={{ color: "var(--cyan)" }}>{seed}</span>
      </div>
    </div>
  );
});
