import Link from "next/link";
import { Header } from "@/components/ui/Header";
import { getSession, createSupabaseServerClient } from "@/lib/supabase/server";
import { NewMapModal } from "@/components/home/NewMapModal";

type MapRow = {
  id: string;
  title: string;
  root_word: string | null;
  updated_at: string;
};

export default async function HomePage() {
  const user = await getSession();
  let maps: MapRow[] = [];
  if (user) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("mindmaps")
      .select("id, title, root_word, updated_at")
      .order("updated_at", { ascending: false })
      .limit(30);
    maps = (data ?? []) as MapRow[];
  }

  return (
    <>
      <Header />
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 20px" }}>
        <section style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 10 }}>
            MindSource
          </h1>
          <p style={{ color: "#c5cad6", fontSize: 15, lineHeight: 1.7 }}>
            連想語をつなげていくマインドマップを、手動でもAIでも作れるWebアプリ。
            起点の1語から自動で連想の網を広げ、気になるノードは手動で編集できます。
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            {user ? (
              <NewMapModal
                loggedIn
                triggerLabel="+ 新しいマインドマップ"
                triggerStyle={primary()}
              />
            ) : (
              <>
                <NewMapModal
                  loggedIn={false}
                  triggerLabel="ログインなしで試す"
                  triggerStyle={primary()}
                />
                <Link href="/login" style={outline()}>ログインして保存</Link>
              </>
            )}
          </div>
        </section>

        {user && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={h2()}>あなたのマインドマップ</h2>
            {maps.length === 0 ? (
              <div style={{ color: "#9aa3b5", fontSize: 14 }}>まだマップがありません。</div>
            ) : (
              <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
                {maps.map((m) => (
                  <li key={m.id}>
                    <Link href={`/maps/${m.id}`} style={card()}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{m.title}</div>
                      {m.root_word && (
                        <div style={{ color: "#9aa3b5", fontSize: 12 }}>起点: {m.root_word}</div>
                      )}
                      <div style={{ color: "#9aa3b5", fontSize: 11, marginTop: 6 }}>
                        {new Date(m.updated_at).toLocaleString("ja-JP")}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section style={{ marginBottom: 40 }}>
          <h2 style={h2()}>使い方</h2>
          <ol style={{ paddingLeft: 20, lineHeight: 2, fontSize: 14, color: "#d5d9e3" }}>
            <li>ホームから「新しいマインドマップ」を開く。</li>
            <li>
              ツールバーに<strong>起点ワード</strong>を入れて「自動生成 (cascade)」を押すと、
              AIが関連語のネットワークを一括生成。
            </li>
            <li>
              あるいは、ノードをダブルクリックすると<strong>その語の連想を1世代だけ</strong>追加 (expand)。
            </li>
            <li>ノードはドラッグで配置、ダブルクリックで編集、パネルから子ノード追加や削除も可能。</li>
            <li>「共有」ボタンのURLを他の人に渡すと、リアルタイムで一緒に編集できる。</li>
            <li>完成したら PNG / SVG でエクスポート。</li>
          </ol>
        </section>

        <section>
          <h2 style={h2()}>機能</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
            <Feature title="自動生成" desc="word-api (chiVe) から日本語の連想語を取得" />
            <Feature title="手動編集" desc="ドラッグ、ラベル編集、子ノード追加" />
            <Feature title="リアルタイム共同編集" desc="Yjs CRDTで競合なし同期" />
            <Feature title="画像エクスポート" desc="PNG / SVG" />
            <Feature title="匿名でもOK" desc="ログインなしで作成、後から保存も可能" />
            <Feature title="カスタマイズ" desc="閾値・品詞・レイアウト・色" />
          </div>
        </section>
      </main>
    </>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={card()}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>
      <div style={{ color: "#9aa3b5", fontSize: 13 }}>{desc}</div>
    </div>
  );
}
function h2(): React.CSSProperties {
  return { fontSize: 18, fontWeight: 700, marginBottom: 14 };
}
function primary(): React.CSSProperties {
  return { padding: "10px 16px", borderRadius: 10, background: "var(--accent)", color: "#0b0d12", fontWeight: 700 };
}
function outline(): React.CSSProperties {
  return { padding: "10px 16px", borderRadius: 10, border: "1px solid var(--border)", color: "var(--foreground)" };
}
function card(): React.CSSProperties {
  return {
    display: "block",
    padding: 14,
    borderRadius: 10,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
    textDecoration: "none",
  };
}
