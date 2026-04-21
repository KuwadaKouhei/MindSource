"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { nanoid } from "nanoid";
import { Tag } from "@/components/ui/primitives/Tag";
import { SeedInput } from "@/components/ui/primitives/SeedInput";
import { Button } from "@/components/ui/primitives/Button";
import { LivePreview, type LivePreviewHandle } from "./LivePreview";

const CHIPS = ["コーヒー", "東京", "宇宙", "記憶", "旅行", "音楽"];

type Props = {
  loggedIn: boolean;
};

export function Hero({ loggedIn }: Props) {
  const router = useRouter();
  const [seed, setSeed] = useState("");
  const previewRef = useRef<LivePreviewHandle>(null);

  const launch = (word: string) => {
    const trimmed = word.trim();
    if (!trimmed) return;
    if (loggedIn) {
      (async () => {
        const res = await fetch("/api/maps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmed, root_word: trimmed }),
        });
        if (!res.ok) return;
        const { id } = (await res.json()) as { id: string };
        router.push(`/maps/${id}?seed=${encodeURIComponent(trimmed)}`);
      })();
    } else {
      const localId = nanoid(10);
      const params = new URLSearchParams();
      params.set("title", trimmed);
      params.set("seed", trimmed);
      router.push(`/maps/local/${localId}?${params.toString()}`);
    }
  };

  const onChip = (word: string) => {
    setSeed(word);
    previewRef.current?.regen(word);
  };

  return (
    <section
      style={{
        position: "relative",
        zIndex: 2,
        maxWidth: 1180,
        margin: "0 auto",
        padding: "96px 28px 64px",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
        gap: 48,
        alignItems: "center",
      }}
    >
      <div>
        <Tag>● AI-DRIVEN ASSOCIATION NETWORK</Tag>
        <h1
          style={{
            fontSize: "clamp(38px, 5.2vw, 62px)",
            lineHeight: 1.08,
            fontWeight: 900,
            letterSpacing: "-2px",
            margin: "22px 0 18px",
            color: "var(--text)",
          }}
        >
          一語から、
          <br />
          <span
            style={{
              color: "var(--cyan)",
              textShadow: "0 0 24px rgba(79,209,255,0.45)",
            }}
          >
            思考のネットワーク
          </span>
          <br />
          を合成する。
        </h1>
        <p
          className="mono"
          style={{
            fontSize: 13,
            color: "var(--muted2)",
            letterSpacing: 0.6,
            marginBottom: 28,
          }}
        >
          &gt; type a seed word to synthesize the network
        </p>

        <SeedInput
          size="hero"
          value={seed}
          onChange={setSeed}
          onSubmit={launch}
        />

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 18,
            alignItems: "center",
          }}
        >
          <span
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--muted)",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginRight: 4,
            }}
          >
            suggest /
          </span>
          {CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => onChip(c)}
              className="clip-notch-sm chip-hover"
              style={{
                padding: "6px 12px",
                fontSize: 12,
                color: "var(--text)",
                background: "var(--bg3)",
                border: "1px solid var(--line2)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <div
          className="mono"
          style={{
            marginTop: 22,
            fontSize: 11,
            color: "var(--muted)",
            letterSpacing: 0.6,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              padding: "3px 8px",
              background: "rgba(79,209,255,0.1)",
              border: "1px solid var(--cyan-deep)",
              color: "var(--cyan)",
              letterSpacing: 1,
            }}
          >
            [NO_AUTH_REQUIRED]
          </span>
          <span style={{ color: "var(--green)" }}>●</span>
          ログインなしで使えます · 後からアカウント連携して保存もOK
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 30, flexWrap: "wrap" }}>
          <Button variant="primary" onClick={() => router.push("/login")}>
            &gt; ログイン
          </Button>
          <Button
            variant="ghost"
            onClick={() => launch(seed.trim() || "コーヒー")}
          >
            &gt; ログインなしで試す
          </Button>
        </div>
      </div>

      <div>
        <LivePreview ref={previewRef} />
      </div>
    </section>
  );
}
