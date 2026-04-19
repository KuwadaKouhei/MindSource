"use client";

import { get, set, del, keys } from "idb-keyval";
import type { Edge, Node } from "@xyflow/react";
import type { Settings } from "@/lib/settings/schema";

const KEY_PREFIX = "mindsource:draft:";

export type Snapshot = {
  nodes: Node[];
  edges: Edge[];
  viewport: { x: number; y: number; zoom: number } | null;
};

export type LocalDraft = {
  localId: string;
  title: string;
  rootWord: string | null;
  snapshot: Snapshot;
  settingsOverride: Partial<Settings> | null;
  updatedAt: number;
};

function key(localId: string) {
  return `${KEY_PREFIX}${localId}`;
}

export async function saveDraft(draft: LocalDraft): Promise<void> {
  await set(key(draft.localId), { ...draft, updatedAt: Date.now() });
}

export async function loadDraft(localId: string): Promise<LocalDraft | null> {
  const v = await get<LocalDraft>(key(localId));
  return v ?? null;
}

export async function deleteDraft(localId: string): Promise<void> {
  await del(key(localId));
}

export async function listDrafts(): Promise<LocalDraft[]> {
  const allKeys = await keys();
  const drafts: LocalDraft[] = [];
  for (const k of allKeys) {
    if (typeof k === "string" && k.startsWith(KEY_PREFIX)) {
      const v = await get<LocalDraft>(k);
      if (v) drafts.push(v);
    }
  }
  return drafts.sort((a, b) => b.updatedAt - a.updatedAt);
}
