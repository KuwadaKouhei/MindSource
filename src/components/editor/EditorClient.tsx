"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "./Canvas";
import type { Snapshot } from "@/lib/storage/localDraft";
import { loadDraft, saveDraft } from "@/lib/storage/localDraft";
import type { Settings } from "@/lib/settings/schema";
import { useSettings } from "@/hooks/useSettings";

type Props = {
  mode: "saved" | "local";
  mapId: string;
  roomId: string;
  title: string;
  initialSnapshot: Snapshot | null;
  settings: Settings;
  seedWord?: string | null;
};

export function EditorClient({
  mode,
  mapId,
  roomId,
  title,
  initialSnapshot,
  settings: initialSettings,
  seedWord,
}: Props) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(initialSnapshot);
  const [currentTitle, setCurrentTitle] = useState(title);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const settings = useSettings(initialSettings);
  const hydratedFromLocalRef = useRef(false);

  // Anonymous map: hydrate snapshot from IndexedDB if present
  useEffect(() => {
    if (mode !== "local" || hydratedFromLocalRef.current) return;
    hydratedFromLocalRef.current = true;
    loadDraft(mapId).then((d) => {
      if (d) {
        setSnapshot(d.snapshot);
        setCurrentTitle(d.title);
      }
    });
  }, [mode, mapId]);

  const onSnapshotChange = useCallback(
    async (next: Snapshot) => {
      if (mode === "local") {
        await saveDraft({
          localId: mapId,
          title: currentTitle,
          rootWord: null,
          snapshot: next,
          settingsOverride: null,
          updatedAt: Date.now(),
        });
      } else {
        setSaveState("saving");
        try {
          await fetch(`/api/maps/${mapId}/snapshot`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(next),
          });
          setSaveState("saved");
          setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 1500);
        } catch {
          setSaveState("error");
        }
      }
    },
    [mode, mapId, currentTitle],
  );

  const onTitleChange = useCallback(
    async (t: string) => {
      setCurrentTitle(t);
      if (mode === "saved") {
        await fetch(`/api/maps/${mapId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: t }),
        });
      } else {
        const existing = await loadDraft(mapId);
        if (existing) {
          await saveDraft({ ...existing, title: t, updatedAt: Date.now() });
        }
      }
    },
    [mode, mapId],
  );

  return (
    <Canvas
      roomId={roomId}
      enableCollab
      initialSnapshot={snapshot}
      initialTitle={currentTitle}
      settings={settings}
      onSnapshotChange={onSnapshotChange}
      onTitleChange={onTitleChange}
      saveState={mode === "saved" ? saveState : "idle"}
      autoSeedWord={seedWord ?? null}
    />
  );
}
