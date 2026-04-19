import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/ui/Header";
import { getSession, createSupabaseServerClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/me/SignOutButton";
import { DeleteMapButton } from "@/components/me/DeleteMapButton";
import { DraftImporter } from "@/components/me/DraftImporter";

export default async function MePage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const supabase = await createSupabaseServerClient();
  const { data: maps } = await supabase
    .from("mindmaps")
    .select("id, title, root_word, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <>
      <Header />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
        <section style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>マイページ</h1>
          <div style={{ color: "#9aa3b5", fontSize: 13, marginBottom: 14 }}>{user.email}</div>
          <SignOutButton />
        </section>

        <DraftImporter />

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>保存済みマインドマップ</h2>
          {!maps?.length ? (
            <div style={{ color: "#9aa3b5", fontSize: 14 }}>まだマップがありません。</div>
          ) : (
            <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {maps.map((m) => (
                <li
                  key={m.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                  }}
                >
                  <Link href={`/maps/${m.id}`} style={{ flex: 1, textDecoration: "none", color: "var(--foreground)" }}>
                    <div style={{ fontWeight: 600 }}>{m.title}</div>
                    {m.root_word && (
                      <div style={{ color: "#9aa3b5", fontSize: 12 }}>起点: {m.root_word}</div>
                    )}
                    <div style={{ color: "#9aa3b5", fontSize: 11 }}>
                      {new Date(m.updated_at).toLocaleString("ja-JP")}
                    </div>
                  </Link>
                  <DeleteMapButton id={m.id} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
