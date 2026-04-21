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
    <div style={{ display: "flex", alignItems: "center", paddingLeft: 4 }}>
      {users.map((u) => (
        <span
          key={u.id}
          className="pav"
          title={u.name}
          style={{ background: u.color }}
        >
          {(u.name || "?").slice(0, 1).toUpperCase()}
        </span>
      ))}
    </div>
  );
}
