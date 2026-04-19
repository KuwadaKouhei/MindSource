"use client";

import { useEffect, useState } from "react";
import type { WebsocketProvider } from "y-websocket";

type User = { id: number; name: string; color: string };

type Props = { provider: WebsocketProvider | null };

export function PresenceBar({ provider }: Props) {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!provider) return;
    const awareness = provider.awareness;
    const myId = awareness.clientID;
    const color = `hsl(${Math.floor(Math.random() * 360)} 70% 60%)`;
    awareness.setLocalStateField("user", {
      id: myId,
      name: "ゲスト",
      color,
    });
    const onChange = () => {
      const all: User[] = [];
      awareness.getStates().forEach((s, clientId) => {
        const u = (s as { user?: User }).user;
        if (u) all.push({ ...u, id: clientId });
      });
      setUsers(all);
    };
    awareness.on("change", onChange);
    onChange();
    return () => {
      awareness.off("change", onChange);
    };
  }, [provider]);

  if (!provider) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {users.map((u) => (
        <div
          key={u.id}
          title={u.name}
          style={{
            width: 26,
            height: 26,
            borderRadius: 9999,
            background: u.color,
            border: "2px solid var(--surface)",
            marginLeft: -6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0b0d12",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {u.name.slice(0, 1)}
        </div>
      ))}
    </div>
  );
}
