"use client";

import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { Tag } from "@/components/ui/primitives/Tag";
import { Button } from "@/components/ui/primitives/Button";

type Props = {
  loggedIn: boolean;
};

export function CtaBand({ loggedIn }: Props) {
  const router = useRouter();
  const goTrial = () => {
    const id = nanoid(10);
    router.push(`/maps/local/${id}`);
  };
  return (
    <section
      className="corners"
      style={{
        position: "relative",
        zIndex: 2,
        maxWidth: 1180,
        margin: "48px auto",
        padding: "56px 28px",
        background:
          "linear-gradient(135deg, rgba(79,209,255,0.08), rgba(5,8,15,0.2) 60%)",
        border: "1px solid var(--line2)",
        clipPath:
          "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
        textAlign: "center",
      }}
    >
      <Tag variant="amber">● Ready / init</Tag>
      <h2
        style={{
          fontSize: "clamp(32px, 4vw, 48px)",
          fontWeight: 900,
          letterSpacing: "-1.5px",
          margin: "18px 0 10px",
        }}
      >
        さあ、最初の一語を。
      </h2>
      <p
        className="mono"
        style={{
          fontSize: 13,
          color: "var(--muted2)",
          letterSpacing: 0.5,
          marginBottom: 28,
        }}
      >
        &gt; no account · no credit card · just type
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Button variant="primary" onClick={goTrial}>
          &gt; ログインなしで試す
        </Button>
        {!loggedIn && (
          <Button variant="ghost" onClick={() => router.push("/login")}>
            &gt; ログイン
          </Button>
        )}
      </div>
    </section>
  );
}
