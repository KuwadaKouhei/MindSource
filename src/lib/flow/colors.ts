export const COLOR_SCHEMES = {
  default: ["#7c9cff", "#a28bff", "#ff8bd0", "#ffb47a", "#8bffb8", "#ffd76b"],
  // Cool blue/green gradient
  cool: ["#7c9cff", "#8ed4ff", "#8bffcf", "#a8ffba", "#d9ffa0", "#ffd76b"],
  // Warm sunset
  warm: ["#ff8080", "#ffb47a", "#ffd76b", "#ffe38e", "#ffc0a8", "#ff8bd0"],
  // Monochrome (grayscale-ish)
  mono: ["#c7cdda", "#aab0be", "#8e93a0", "#717683", "#565b65", "#3e424b"],
  // Vivid accent
  vivid: ["#ff5472", "#b15cff", "#4cc8ff", "#2de3a0", "#ffd33b", "#ff8a2e"],
} as const;

export type ColorSchemeName = keyof typeof COLOR_SCHEMES;

export function isKnownScheme(v: string): v is ColorSchemeName {
  return v in COLOR_SCHEMES;
}

export function getPalette(scheme?: string): string[] {
  if (scheme && isKnownScheme(scheme)) return [...COLOR_SCHEMES[scheme]];
  return [...COLOR_SCHEMES.default];
}

export function colorForGen(scheme: string | undefined, gen: number): string {
  const palette = getPalette(scheme);
  return palette[gen % palette.length];
}
