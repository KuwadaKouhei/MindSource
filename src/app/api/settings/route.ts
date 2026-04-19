import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_SETTINGS, safeParseSettings } from "@/lib/settings/defaults";
import { SettingsSchema } from "@/lib/settings/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json(DEFAULT_SETTINGS);

  const { data } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.user.id)
    .maybeSingle();
  if (!data) return NextResponse.json(DEFAULT_SETTINGS);
  return NextResponse.json(safeParseSettings(data));
}

export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = SettingsSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_settings", detail: parsed.error.flatten() }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: user.user.id, ...parsed.data });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
