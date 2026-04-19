import { getSession } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_SETTINGS, safeParseSettings } from "@/lib/settings/defaults";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { Header } from "@/components/ui/Header";

export default async function SettingsPage() {
  const user = await getSession();
  let initial = DEFAULT_SETTINGS;
  if (user) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) initial = safeParseSettings(data);
  }
  return (
    <>
      <Header />
      <main style={{ maxWidth: 760, margin: "0 auto", padding: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>設定</h1>
        <p style={{ color: "#9aa3b5", marginBottom: 24, fontSize: 13 }}>
          {user
            ? "自動生成のパラメータを編集します。ログイン中: 変更はアカウントに保存されます。"
            : "自動生成のパラメータを編集します。未ログイン: ブラウザのローカルストレージに保存されます。"}
        </p>
        <SettingsForm initial={initial} persistRemote={!!user} />
      </main>
    </>
  );
}
