import { Tag } from "@/components/ui/primitives/Tag";

const STEPS = [
  { n: "01", label: "新規マップを開く" },
  { n: "02", label: "起点ワード → 自動生成 (cascade)" },
  { n: "03", label: "ダブルクリックで拡張 (expand)" },
  { n: "04", label: "手動で編集" },
  { n: "05", label: "共有URLで共同編集" },
  { n: "06", label: "PNG / SVG で出力" },
];

export function HowItWorks() {
  return (
    <section
      id="usage"
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
        // 01 <span style={{ color: "var(--cyan)" }}>使い方</span> / how_it_works.md
      </div>
      <h2
        style={{
          fontSize: "clamp(26px, 3vw, 34px)",
          fontWeight: 800,
          letterSpacing: "-1px",
          marginBottom: 40,
        }}
      >
        6ステップで、思考が図解になる。
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 10,
          alignItems: "stretch",
        }}
      >
        {STEPS.map((s, i) => (
          <div
            key={s.n}
            className="corners reveal"
            style={{
              position: "relative",
              background: "var(--bg2)",
              border: "1px solid var(--line)",
              clipPath:
                "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
              padding: "18px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              minHeight: 140,
              transitionDelay: `${i * 70}ms`,
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: 2,
                color: "var(--cyan)",
              }}
            >
              <Tag>{s.n}</Tag>
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text)",
                lineHeight: 1.5,
              }}
            >
              {s.label}
            </div>
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  right: -7,
                  top: "50%",
                  width: 14,
                  height: 14,
                  transform: "translateY(-50%) rotate(45deg)",
                  borderTop: "1.5px solid var(--cyan)",
                  borderRight: "1.5px solid var(--cyan)",
                  filter: "drop-shadow(0 0 3px rgba(79,209,255,0.6))",
                  zIndex: 3,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
