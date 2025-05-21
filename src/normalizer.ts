import type {
  NormalizedPluginOptions,
  NormalizedTypeStep,
  NormalizedTypeStepsMap,
  PluginOptions,
  TypeStep,
  TypeStepsMap,
} from "./types.js";

import { BASE_FONT_SIZE, DEFAULT_OPTIONS, DEFAULT_STEPS } from "./constants.js";
import { log } from "./log.js";
import { isEmptyObject, typedEntries } from "./utils.js";

type TypeStepNormalizer = {
  [K in keyof TypeStep]: (value: TypeStep[K] | string) => NormalizedTypeStep[K] | null;
};

const typeStepsNormalizer: TypeStepNormalizer = {
  step: (value) => {
    if (typeof value === "number") return value;
    if (typeof value !== "string") return null;

    const numValue = parseFloat(value.trim());
    return isNaN(numValue) ? null : numValue;
  },
  fontSize: (value) => {
    if (typeof value === "number") return `${value}px`;
    if (typeof value !== "string") return null;
    return value.trim();
  },
  lineHeight: (value) => {
    if (typeof value === "number") return String(value);
    if (typeof value !== "string") return null;
    return value.trim();
  },
  letterSpacing: (value) => {
    if (typeof value !== "string") return null;
    return value.trim();
  },
};

export function normalizeTypeSteps(steps: TypeStepsMap): NormalizedTypeStepsMap {
  const normalizedSteps: NormalizedTypeStepsMap = {};

  for (const [stepName, stepConfig] of Object.entries(steps)) {
    const typeStep: NormalizedTypeStep = {};

    for (const [key, value] of typedEntries(stepConfig)) {
      const normalizer = typeStepsNormalizer[key];
      if (!normalizer) {
        log(`Unknown property "${key}" in @${stepName} step. Skipping.`);
        continue;
      }

      const normalizedValue = normalizer?.(value as any);

      if (normalizedValue !== null) {
        typeStep[key] = normalizedValue as any;
      } else {
        log(`Invalid ${key} value "${value}" in @${stepName}. Skipping.`);
      }
    }

    if (typeStep.step === undefined && typeStep.fontSize === undefined) {
      log(`Invalid config for "${stepName}" step. fontSize and step are both undefined. Skipping.`);
      continue;
    }

    normalizedSteps[stepName] = typeStep;
  }

  return isEmptyObject(normalizedSteps) ? DEFAULT_STEPS : normalizedSteps;
}

type OptionsNormalizer = {
  [K in keyof Partial<NormalizedPluginOptions>]: (
    value: PluginOptions[K]
  ) => NormalizedPluginOptions[K] | null;
};

const UNIT_REGEX = /^(\d*\.?\d+)(rem|em|px)?$/;

const optionsNormalizers: OptionsNormalizer = {
  scale: (value) => {
    if (typeof value === "number") return value;
    return null;
  },
  fontSize: (value) => {
    if (typeof value === "number") return value;
    if (typeof value !== "string") return null;

    const match = value.trim().toLowerCase().match(UNIT_REGEX);
    if (!match) return null;

    const numValue = parseFloat(match[1]);
    const unit = match[2];

    if (unit === "rem" || unit === "em") return numValue * BASE_FONT_SIZE;
    return numValue;
  },
  lineHeight: (value) => {
    if (typeof value === "number") return value.toString();
    if (typeof value !== "string") return null;
    return value.trim() || null;
  },
  prefix: (value) => {
    if (typeof value !== "string") return null;
    return value.replace(/[^a-zA-Z0-9_-]/g, "");
  },
  rounded: (value) => {
    if (typeof value !== "boolean") return null;
    return value;
  },
  emit: (value) => {
    if (typeof value !== "string") return null;
    return value.toLowerCase() === "variables" ? "variables" : null;
  },
};

export function normalizeOptions(options: Omit<PluginOptions, "steps">): NormalizedPluginOptions {
  const normalizedOptions: Partial<NormalizedPluginOptions> = {};

  for (const [key, value] of typedEntries(options)) {
    const normalizer = optionsNormalizers[key];
    if (!normalizer) {
      log(`Unknown property "${key}" in @typescaler rule. Skipping.`);
      continue;
    }

    const normalizedValue = normalizer?.(value as any);

    if (normalizedValue !== undefined) {
      normalizedOptions[key] = normalizedValue as any;
    } else if (DEFAULT_OPTIONS[key] !== undefined) {
      log(`Invalid ${key} value "${value}". Using default value: ${DEFAULT_OPTIONS[key]}.`);
    } else {
      log(`Invalid ${key} value "${value}". Skipping.`);
    }
  }

  return { ...DEFAULT_OPTIONS, ...normalizedOptions };
}
