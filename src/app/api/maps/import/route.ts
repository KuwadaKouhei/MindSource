import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title : "Imported";
  const rootWord = typeof body.root_word === "string" ? body.root_word : null;
  const snapshot = body.snapshot ?? { nodes: [], edges: [], viewport: null };
  const settingsOverride = body.settings_override ?? null;

  const { data, error } = await supabase
    .from("mindmaps")
    .insert({
      owner_id: user.user.id,
      title,
      root_word: rootWord,
      snapshot,
      settings_override: settingsOverride,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
