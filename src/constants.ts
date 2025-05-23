import type { NormalizedPluginOptions, NormalizedTypeStepsMap } from "./types.js";

export const BASE_FONT_SIZE = 16;

export const DEFAULT_OPTIONS = {
  scale: 1.125,
  fontSize: 16,
  lineHeight: "1.5",
  prefix: "type",
  rounded: true,
  stepOffset: 0,
  preset: undefined,
} satisfies NormalizedPluginOptions;

// tailwind font sizes
const TAILWIND_STEPS = {
  xs: { step: -2.4, lineHeight: "calc(1 / 0.75)" },
  sm: { step: -1.1, lineHeight: "calc(1.25 / 0.875)" },
  base: { step: 0, lineHeight: "calc(1.5 / 1)" },
  lg: { step: 1, lineHeight: "calc(1.75 / 1.125)" },
  xl: { step: 2, lineHeight: "calc(1.75 / 1.25)" },
  "2xl": { step: 3.4, lineHeight: "calc(2 / 1.5)" },
  "3xl": { step: 5.3, lineHeight: "calc(2.25 / 1.875)" },
  "4xl": { step: 7, lineHeight: "calc(2.5 / 2.25)" },
  "5xl": { step: 9.3, lineHeight: "1" },
  "6xl": { step: 11.2, lineHeight: "1" },
  "7xl": { step: 12.8, lineHeight: "1" },
  "8xl": { step: 15.2, lineHeight: "1" },
  "9xl": { step: 17.7, lineHeight: "1" },
} satisfies NormalizedTypeStepsMap;

const DEFAULT_STEPS = {
  xs: { step: -2, lineHeight: "1.3" },
  sm: { step: -1, lineHeight: "1.4" },
  base: { step: 0, lineHeight: "1.5" },
  md: { step: 0, lineHeight: "1.5" }, // Alias for base
  lg: { step: 1, lineHeight: "1.5" },
  xl: { step: 2, lineHeight: "1.4" },
  "2xl": { step: 3, lineHeight: "1.3" },
  "3xl": { step: 4, lineHeight: "1.2" },
  "4xl": { step: 5, lineHeight: "1.1" },
  "5xl": { step: 6, lineHeight: "1" },
  "6xl": { step: 7, lineHeight: "1" },
  "7xl": { step: 8, lineHeight: "1" },
  "8xl": { step: 9, lineHeight: "1" },
  "9xl": { step: 10, lineHeight: "1" },
} satisfies NormalizedTypeStepsMap;

export function getPresetSteps(preset?: string): NormalizedTypeStepsMap {
  if (preset === "tailwind") {
    return TAILWIND_STEPS;
  } else if (preset === "default") {
    return DEFAULT_STEPS;
  }
  return {};
}
