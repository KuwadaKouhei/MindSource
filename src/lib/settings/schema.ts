import { z } from "zod";

export const AutoModeSchema = z.enum(["cascade", "expand"]);
export const LayoutSchema = z.enum(["radial", "hierarchical", "generation"]);

export const SettingsSchema = z.object({
  depth: z.number().int().min(1).max(4),
  top_k: z.number().int().min(1).max(30),
  min_score: z.number().min(0).max(1),
  pos: z.array(z.string()),
  use_stopwords: z.boolean(),
  exclude: z.array(z.string()),
  auto_mode: AutoModeSchema,
  layout: LayoutSchema,
  color_scheme: z.string(),
  max_nodes: z.number().int().min(10).max(500),
  // Extra vertical padding added between consecutive rings in the radial
  // layout, keyed by child-ring index. Index 0 is the pad between the center
  // and ring 1 (gen 1), index 1 is between ring 1 and ring 2, etc.
  // Values past the end reuse the last element.
  ring_gaps: z.array(z.number().int().min(0).max(400)).min(1).max(6),
});

export type Settings = z.infer<typeof SettingsSchema>;
export type AutoMode = z.infer<typeof AutoModeSchema>;
export type LayoutMode = z.infer<typeof LayoutSchema>;
