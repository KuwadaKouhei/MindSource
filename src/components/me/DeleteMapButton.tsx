"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteMapButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => {
        if (!confirm("このマインドマップを削除しますか？")) return;
        setBusy(true);
        await fetch(`/api/maps/${id}`, { method: "DELETE" });
        setBusy(false);
        router.refresh();
      }}
      disabled={busy}
      style={{
        padding: "6px 10px",
        borderRadius: 8,
        background: "#3a1a1f",
        border: "1px solid #6a2734",
        color: "#ffb3bd",
        cursor: "pointer",
        fontSize: 12,
      }}
    >
      {busy ? "…" : "削除"}
    </button>
  );
}
