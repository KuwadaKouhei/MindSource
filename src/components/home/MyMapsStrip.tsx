import Link from "next/link";
import { Tag } from "@/components/ui/primitives/Tag";

type MapRow = {
  id: string;
  title: string;
  root_word: string | null;
  updated_at: string;
};

type Props = {
  maps: MapRow[];
};

export function MyMapsStrip({ maps }: Props) {
  if (!maps.length) return null;
  return (
    <section
      style={{
        position: "relative",
        zIndex: 2,
        maxWidth: 1180,
        margin: "0 auto",
        padding: "26px 28px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 12,
        }}
      >
        <Tag>● RECENT_SESSIONS</Tag>
        <span
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--muted)",
            letterSpacing: 0.5,
          }}
        >
          /maps · {maps.length}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          paddingBottom: 6,
        }}
      >
        {maps.map((m) => (
          <Link
            key={m.id}
            href={`/maps/${m.id}`}
            className="clip-notch-sm"
            style={{
              flex: "0 0 220px",
              padding: "12px 14px",
              background: "var(--bg3)",
              border: "1px solid var(--line2)",
              color: "var(--text)",
              transition: "border-color 0.15s, transform 0.15s",
              display: "block",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: 13,
                color: "var(--text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginBottom: 6,
              }}
            >
              {m.title || "Untitled"}
            </div>
            {m.root_word && (
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  color: "var(--cyan)",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                $ {m.root_word}
              </div>
            )}
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--muted)",
                letterSpacing: 0.3,
              }}
            >
              {new Date(m.updated_at).toLocaleString("ja-JP", {
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
