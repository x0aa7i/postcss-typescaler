import type { NormalizedPluginOptions, NormalizedStepsObject, PluginOptions, StepOptions } from "./types.js";

import { DEFAULT_OPTIONS, DEFAULT_STEPS } from "./constants.js";
import { isEmptyObject, isNumeric, logWarning, typedEntries } from "./utils.js";

const CSS_UNITS = ["px", "em", "rem", "ex", "ch", "vw", "vh", "vmin", "vmax"];
// prettier-ignore
const FONT_SIZES = ["small", "medium", "large", "x-large", "xx-large", "smaller", "larger", "initial", "inherit"];

const CSS_UNIT_REGEX = new RegExp(`^([-+]?\\d*\\.?\\d+)(?:${CSS_UNITS.join("|")})$`, "i");

const isValidCSSUnit = (value: string): boolean => CSS_UNIT_REGEX.test(value);

const isValidKeyword = (value: string) => FONT_SIZES.includes(value.toLowerCase());

function isValidFontSize(value?: string | number): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "number") return true;
  if (typeof value !== "string") return false;

  const trimmed = value.trim().toLowerCase();
  return isValidCSSUnit(trimmed) || isValidKeyword(trimmed);
}

function isValidLetterSpacing(value?: string): boolean {
  if (typeof value !== "string") return false;

  const trimmed = value.trim().toLowerCase();
  return isValidCSSUnit(trimmed) || trimmed === "normal";
}

function isValidLineHeight(value?: string | number): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "number") return true;
  if (typeof value !== "string") return false;

  const trimmed = value.trim().toLowerCase();
  return isValidCSSUnit(trimmed) || isNumeric(trimmed) || trimmed === "normal";
}

type StepValidationRules = {
  [K in keyof StepOptions]: (value: any) => value is StepOptions[K];
};

type OptionsValidationRules = {
  [K in keyof NormalizedPluginOptions]: (value: any) => value is NormalizedPluginOptions[K];
};

const stepValidationRules: StepValidationRules = {
  fontSize: (value): value is string | number => isValidFontSize(value),
  lineHeight: (value): value is string | number => isValidLineHeight(value),
  letterSpacing: (value): value is string => isValidLetterSpacing(value),
  step: (value): value is number => isNumeric(value),
};

const optionsValidationRules: OptionsValidationRules = {
  fontSize: (value): value is number => isNumeric(value),
  lineHeight: (value): value is number | string => isValidLineHeight(value),
  scale: (value): value is number => isNumeric(value),
  prefix: (value): value is string => !!value && !!value.trim().length,
  rounded: (value): value is boolean => true,
  emit: (value): value is "variables" => !!value && value.toLowerCase() === "variables",
};

function isStepKey(key: PropertyKey): key is keyof StepOptions {
  return key in stepValidationRules;
}

function isOptionKey(key: PropertyKey): key is keyof NormalizedPluginOptions {
  return key in optionsValidationRules;
}

/**
 * Parse steps configurations from a TypeScalerOptions object
 */
export function validateSteps(steps: NormalizedStepsObject): NormalizedStepsObject {
  if (isEmptyObject(steps)) return DEFAULT_STEPS;

  const validSteps: NormalizedStepsObject = {};

  for (const [stepName, stepOpts] of Object.entries(steps)) {
    if (!stepOpts || typeof stepOpts !== "object") {
      logWarning(`Invalid step config for "${stepName}". Skipping.`);
      continue;
    }

    const currentStep: Partial<StepOptions> = {};

    for (const [key, value] of typedEntries(stepOpts)) {
      if (!isStepKey(key)) {
        logWarning(`"${key}" is not a valid step option. Skipping.`);
        continue;
      }

      const validationRule = stepValidationRules[key];

      if (validationRule?.(value)) {
        currentStep[key] = value as any;
      } else {
        logWarning(`Invalid ${key} value "${value}" in @${stepName}. Skipping.`);
      }
    }

    validSteps[stepName] = currentStep;
  }

  return validSteps;
}

export function validateOptions(options: Omit<PluginOptions, "steps">): NormalizedPluginOptions {
  const validatedOptions: Partial<NormalizedPluginOptions> = {};

  for (const [key, value] of typedEntries(options)) {
    if (!isOptionKey(key)) {
      logWarning(`"${key}" is not a valid option. Skipping.`);
      continue;
    }

    const validationRule = optionsValidationRules[key];

    if (validationRule?.(value)) {
      validatedOptions[key] = value as any;
    } else {
      logWarning(`Invalid ${key} value "${value}". Using default value: ${DEFAULT_OPTIONS[key]}.`);
    }
  }

  return { ...DEFAULT_OPTIONS, ...validatedOptions };
}
