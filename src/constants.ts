import type { NormalizedPluginOptions, NormalizedTypeStepsMap } from "./types.js";

export const BASE_FONT_SIZE = 16;

export const DEFAULT_OPTIONS = {
  scale: 1.125,
  fontSize: 16,
  lineHeight: "1.5",
  prefix: "text",
  rounded: true,
} satisfies NormalizedPluginOptions;

// tailwind font sizes
export const DEFAULT_STEPS = {
  xs: { step: -2 },
  sm: { step: -1 },
  base: { step: 0 },
  md: { step: 0 }, // Alias for base
  lg: { step: 1 },
  xl: { step: 2 },
  "2xl": { step: 3 },
  "3xl": { step: 4 },
  "4xl": { step: 5 },
  "5xl": { step: 6 },
  "6xl": { step: 7 },
  "7xl": { step: 8 },
  "8xl": { step: 9 },
  "9xl": { step: 10 },
} satisfies NormalizedTypeStepsMap;
