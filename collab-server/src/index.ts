import http from "node:http";
import { WebSocketServer } from "ws";
// @ts-expect-error - y-websocket ships the bin handler without types
import { setupWSConnection, setPersistence } from "y-websocket/bin/utils";
// @ts-expect-error - y-leveldb has no type declarations
import { LeveldbPersistence } from "y-leveldb";

const PORT = Number(process.env.PORT ?? 1234);
const HOST = process.env.HOST ?? "0.0.0.0";
const DATA_DIR = process.env.DATA_DIR ?? "./data";
const ALLOWED_ORIGINS = (process.env.CLIENT_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const persistence = new LeveldbPersistence(DATA_DIR);
setPersistence({
  bindState: async (docName: string, ydoc: import("yjs").Doc) => {
    const persisted = await persistence.getYDoc(docName);
    const current = (await import("yjs")).encodeStateAsUpdate(ydoc);
    await persistence.storeUpdate(docName, current);
    (await import("yjs")).applyUpdate(ydoc, (await import("yjs")).encodeStateAsUpdate(persisted));
    ydoc.on("update", (update: Uint8Array) => {
      persistence.storeUpdate(docName, update);
    });
  },
  writeState: async () => {
    // flush is automatic in y-leveldb
  },
});

const server = http.createServer((_req, res) => {
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("mindsource collab-server ok\n");
});

const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (conn, req) => {
  // Room name from URL path: /ws/<roomId>  OR  /<roomId>
  const url = req.url ?? "/";
  const docName = url.replace(/^\/(ws\/)?/, "").split("?")[0] || "default";
  setupWSConnection(conn, req, { docName, gc: true });
});

server.on("upgrade", (req, socket, head) => {
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
});

server.listen(PORT, HOST, () => {
  console.log(`[collab-server] listening on ws://${HOST}:${PORT}`);
  console.log(`[collab-server] allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
  console.log(`[collab-server] persistence dir: ${DATA_DIR}`);
});
