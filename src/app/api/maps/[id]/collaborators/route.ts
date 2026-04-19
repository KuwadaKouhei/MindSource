import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireOwner(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { error: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  const { data: map } = await supabase
    .from("mindmaps")
    .select("owner_id")
    .eq("id", id)
    .maybeSingle();
  if (!map) return { error: NextResponse.json({ error: "not_found" }, { status: 404 }) };
  if (map.owner_id !== user.user.id) return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  return { supabase };
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const res = await requireOwner(id);
  if ("error" in res) return res.error;
  const { supabase } = res;

  const { data, error } = await supabase
    .from("mindmap_collaborators")
    .select("user_id, role, profiles:user_id (display_name, avatar_url)")
    .eq("mindmap_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collaborators: data ?? [] });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const res = await requireOwner(id);
  if ("error" in res) return res.error;
  const { supabase } = res;

  const body = await req.json().catch(() => ({}));
  const userId: string | undefined = body.user_id;
  const role: string = body.role === "viewer" ? "viewer" : "editor";
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
    return NextResponse.json({ error: "invalid_user_id" }, { status: 400 });
  }
  const { error } = await supabase
    .from("mindmap_collaborators")
    .upsert({ mindmap_id: id, user_id: userId, role });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const res = await requireOwner(id);
  if ("error" in res) return res.error;
  const { supabase } = res;

  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id");
  if (!userId) return NextResponse.json({ error: "missing_user_id" }, { status: 400 });
  const { error } = await supabase
    .from("mindmap_collaborators")
    .delete()
    .eq("mindmap_id", id)
    .eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
