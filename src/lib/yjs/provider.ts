"use client";

import { WebsocketProvider } from "y-websocket";
import type * as Y from "yjs";

export function createProvider(roomId: string, ydoc: Y.Doc) {
  const wsUrl = process.env.NEXT_PUBLIC_COLLAB_WS_URL ?? "ws://localhost:1234";
  // Strip trailing slash; provider appends roomName
  const base = wsUrl.replace(/\/$/, "");
  const provider = new WebsocketProvider(base, roomId, ydoc, { connect: true });
  return provider;
}
