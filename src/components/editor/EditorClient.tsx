"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "./Canvas";
import type { Snapshot } from "@/lib/storage/localDraft";
import { loadDraft, saveDraft } from "@/lib/storage/localDraft";
import type { Settings } from "@/lib/settings/schema";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/components/ui/Toaster";

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
  const toast = useToast();
  const currentSnapshotRef = useRef<Snapshot | null>(initialSnapshot);

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
      currentSnapshotRef.current = next;
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
          const res = await fetch(`/api/maps/${mapId}/snapshot`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(next),
          });
          if (!res.ok) throw new Error(`http ${res.status}`);
          setSaveState("saved");
          setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 1500);
        } catch (e) {
          setSaveState("error");
          toast.show({
            kind: "error",
            title: "保存に失敗しました",
            message: (e as Error).message,
          });
        }
      }
    },
    [mode, mapId, currentTitle, toast],
  );

  // Flush any pending snapshot on unload so a fast close doesn't lose edits.
  useEffect(() => {
    const handler = () => {
      const snap = currentSnapshotRef.current;
      if (!snap) return;
      if (mode === "local") {
        // IDB writes are async; kick it off synchronously. Fire-and-forget is OK
        // because the browser keeps the tab alive briefly for pending IDB tx.
        void saveDraft({
          localId: mapId,
          title: currentTitle,
          rootWord: null,
          snapshot: snap,
          settingsOverride: null,
          updatedAt: Date.now(),
        });
      } else {
        // sendBeacon is the only reliable network call during unload.
        try {
          const blob = new Blob([JSON.stringify(snap)], { type: "application/json" });
          navigator.sendBeacon?.(`/api/maps/${mapId}/snapshot`, blob);
        } catch {
          // best-effort
        }
      }
    };
    window.addEventListener("beforeunload", handler);
    window.addEventListener("pagehide", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
      window.removeEventListener("pagehide", handler);
    };
  }, [mode, mapId, currentTitle]);

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
      savedMapId={mode === "saved" ? mapId : null}
    />
  );
}
