"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
      }}
      style={{
        padding: "6px 12px",
        borderRadius: 8,
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        color: "var(--foreground)",
        cursor: "pointer",
        fontSize: 13,
      }}
    >
      ログアウト
    </button>
  );
}
