import { Glyph } from "@/components/ui/primitives/Glyph";

const CARDS: { tag: string; title: string; desc: string; icon: Parameters<typeof Glyph>[0]["name"] }[] = [
  {
    tag: "AUTO_GEN",
    title: "自動生成",
    desc: "relation-word-api (chiVe) を叩いて日本語の連想語ネットワークを一気に合成。",
    icon: "sparkles",
  },
  {
    tag: "SYNC",
    title: "リアルタイム共同編集",
    desc: "Yjs CRDT + y-websocket。複数人で同時に編集しても競合なし。",
    icon: "share",
  },
  {
    tag: "EXPORT",
    title: "画像エクスポート",
    desc: "完成したマインドマップは PNG / SVG で書き出して共有。",
    icon: "download",
  },
  {
    tag: "ANON",
    title: "匿名でもOK",
    desc: "ログインなしで即試せる。気に入ったら後からアカウントに連携。",
    icon: "zap",
  },
  {
    tag: "CONFIG",
    title: "カスタマイズ",
    desc: "閾値・品詞・レイアウト・色スキームまでユーザー側で調整可能。",
    icon: "refresh",
  },
];

export function Features() {
  return (
    <section
      id="features"
      style={{
        position: "relative",
        zIndex: 2,
        maxWidth: 1180,
        margin: "0 auto",
        padding: "64px 28px",
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 11,
          letterSpacing: 1.6,
          color: "var(--muted)",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        // 02 <span style={{ color: "var(--cyan)" }}>機能</span> / features.md
      </div>
      <h2
        style={{
          fontSize: "clamp(26px, 3vw, 34px)",
          fontWeight: 800,
          letterSpacing: "-1px",
          marginBottom: 36,
        }}
      >
        網を広げる、5つの道具。
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 14,
        }}
      >
        {CARDS.map((c, i) => (
          <article
            key={c.tag}
            className="feature-card corners reveal"
            style={{
              position: "relative",
              background: "var(--bg2)",
              border: "1px solid var(--line)",
              clipPath:
                "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
              padding: "22px 20px",
              overflow: "hidden",
              transitionDelay: `${i * 60}ms`,
            }}
          >
            <span
              aria-hidden
              className="feature-bar"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background: "var(--cyan)",
                boxShadow: "0 0 12px rgba(79,209,255,0.7)",
                transform: "translateX(-4px)",
                transition: "transform 0.22s ease",
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
                color: "var(--cyan)",
              }}
            >
              <Glyph name={c.icon} size={18} />
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  letterSpacing: 2,
                  color: "var(--cyan)",
                  textTransform: "uppercase",
                }}
              >
                {c.tag}
              </span>
            </div>
            <h3
              style={{
                fontSize: 17,
                fontWeight: 700,
                marginBottom: 8,
                color: "var(--text)",
              }}
            >
              {c.title}
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "var(--muted2)",
                lineHeight: 1.65,
              }}
            >
              {c.desc}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
