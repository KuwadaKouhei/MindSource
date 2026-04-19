import { EditorClient } from "@/components/editor/EditorClient";
import { DEFAULT_SETTINGS } from "@/lib/settings/defaults";

export const dynamic = "force-dynamic";

export default async function LocalMapPage({
  params,
  searchParams,
}: {
  params: Promise<{ localId: string }>;
  searchParams: Promise<{ title?: string; seed?: string }>;
}) {
  const { localId } = await params;
  const { title, seed } = await searchParams;
  return (
    <EditorClient
      mode="local"
      mapId={localId}
      roomId={`local:${localId}`}
      title={title || "Untitled"}
      initialSnapshot={null}
      settings={DEFAULT_SETTINGS}
      seedWord={seed ?? null}
    />
  );
}
