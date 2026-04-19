import type { Settings } from "./schema";
import { SettingsSchema } from "./schema";

export const DEFAULT_SETTINGS: Settings = {
  depth: 2,
  top_k: 8,
  min_score: 0.5,
  pos: ["名詞"],
  use_stopwords: true,
  exclude: [],
  auto_mode: "expand",
  layout: "hierarchical",
  color_scheme: "default",
  max_nodes: 200,
  // [gen1_pad, gen2+_pad]. The helper below falls back to the last value
  // for any deeper generations.
  ring_gaps: [120, 80],
};

export function ringGapForGen(gaps: number[], gen: number): number {
  if (gaps.length === 0) return 40;
  const idx = Math.max(0, gen - 1);
  return gaps[Math.min(idx, gaps.length - 1)];
}

export const SETTINGS_LOCAL_KEY = "mindsource:settings:v1";

export function mergeSettings(
  base: Settings = DEFAULT_SETTINGS,
  ...overrides: Array<Partial<Settings> | null | undefined>
): Settings {
  const merged: Settings = { ...base };
  for (const o of overrides) {
    if (!o) continue;
    for (const k of Object.keys(o) as Array<keyof Settings>) {
      const v = o[k];
      if (v !== undefined && v !== null) {
        // Type assertion: key/value pairs are keyof Settings; runtime guaranteed by caller
        (merged as Record<string, unknown>)[k] = v;
      }
    }
  }
  return merged;
}

export function safeParseSettings(input: unknown): Settings {
  const result = SettingsSchema.safeParse(input);
  return result.success ? result.data : DEFAULT_SETTINGS;
}
