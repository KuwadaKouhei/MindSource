"use client";

import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, SETTINGS_LOCAL_KEY, safeParseSettings, mergeSettings } from "@/lib/settings/defaults";
import type { Settings } from "@/lib/settings/schema";

export function useSettings(initial?: Partial<Settings> | null, override?: Partial<Settings> | null) {
  const [settings, setSettings] = useState<Settings>(mergeSettings(DEFAULT_SETTINGS, initial ?? undefined, override ?? undefined));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Try server-side first
      try {
        const res = await fetch("/api/settings", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setSettings(mergeSettings(DEFAULT_SETTINGS, safeParseSettings(data), override ?? undefined));
          return;
        }
      } catch {}
      // fallback to localStorage
      try {
        const raw = localStorage.getItem(SETTINGS_LOCAL_KEY);
        if (raw && !cancelled) {
          setSettings(mergeSettings(DEFAULT_SETTINGS, safeParseSettings(JSON.parse(raw)), override ?? undefined));
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [override]);

  return settings;
}
