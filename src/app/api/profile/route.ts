import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", user.user.id)
    .maybeSingle();
  return NextResponse.json(data ?? { id: user.user.id, display_name: null, avatar_url: null });
}

export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (typeof body.display_name === "string") patch.display_name = body.display_name;
  if (typeof body.avatar_url === "string" || body.avatar_url === null) patch.avatar_url = body.avatar_url;

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.user.id, ...patch });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
