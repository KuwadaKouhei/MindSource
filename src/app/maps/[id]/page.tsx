import { notFound, redirect } from "next/navigation";
import { getSession, createSupabaseServerClient } from "@/lib/supabase/server";
import { EditorClient } from "@/components/editor/EditorClient";
import { DEFAULT_SETTINGS, safeParseSettings, mergeSettings } from "@/lib/settings/defaults";
import type { Settings } from "@/lib/settings/schema";

export const dynamic = "force-dynamic";

type MapRow = {
  id: string;
  title: string;
  root_word: string | null;
  snapshot: { nodes?: unknown[]; edges?: unknown[]; viewport?: unknown } | null;
  settings_override: Partial<Settings> | null;
  owner_id: string;
};

export default async function SavedMapPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ seed?: string }>;
}) {
  const { id } = await params;
  const { seed } = await searchParams;
  const user = await getSession();
  if (!user) redirect(`/login?next=/maps/${id}`);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("mindmaps")
    .select("id, title, root_word, snapshot, settings_override, owner_id")
    .eq("id", id)
    .single();

  if (error || !data) notFound();
  const map = data as MapRow;

  const { data: settingsRow } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const baseSettings: Settings = mergeSettings(
    DEFAULT_SETTINGS,
    settingsRow ? safeParseSettings(settingsRow) : undefined,
    (map.settings_override ?? undefined) as Partial<Settings> | undefined,
  );

  return (
    <EditorClient
      mode="saved"
      mapId={map.id}
      roomId={map.id}
      title={map.title}
      initialSnapshot={
        map.snapshot
          ? {
              nodes: (map.snapshot.nodes as never) ?? [],
              edges: (map.snapshot.edges as never) ?? [],
              viewport: (map.snapshot.viewport as never) ?? null,
            }
          : null
      }
      settings={baseSettings}
      seedWord={seed ?? null}
    />
  );
}
