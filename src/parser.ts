import type { StepOutput, TypeScalerOptions, TypeScalerStepsConfig } from "./types.js";
import type { AtRule } from "postcss";

import { BASE_FONT_SIZE, DEFAULT_OPTIONS } from "./constants.js";
import { isValidFontSize, isValidLetterSpacing, isValidLineHeight, logWarning } from "./utils.js";

type CssStepsProperties = "step" | "font-size" | "line-height" | "letter-spacing";
type CssStepsValidation = Record<CssStepsProperties, (value: string) => boolean>;

const cssStepsValidation: CssStepsValidation = {
  step: (value) => !isNaN(parseFloat(value)),
  "font-size": isValidFontSize,
  "line-height": isValidLineHeight,
  "letter-spacing": isValidLetterSpacing,
};

const stepsPropertyMap: Record<CssStepsProperties, keyof StepOutput> = {
  step: "step",
  "font-size": "fontSize",
  "line-height": "lineHeight",
  "letter-spacing": "letterSpacing",
};

/**
 * Parse steps configurations from a TypeScalerOptions object
 */
export function parseConfigSteps(steps: TypeScalerStepsConfig): Record<string, StepOutput> {
  const parsedSteps: Record<string, StepOutput> = {};

  for (const stepName in steps) {
    const stepConfig = steps[stepName];

    if (typeof stepConfig === "number") {
      parsedSteps[stepName] = { step: stepConfig };
      continue;
    }

    if (!stepConfig || typeof stepConfig !== "object") {
      logWarning(`Invalid step config for "${stepName}". Skipping.`);
      continue;
    }

    const stepOutput = {} as StepOutput;

    const propertiesToValidate = {
      step: stepConfig.step,
      "font-size": stepConfig.fontSize,
      "line-height": stepConfig.lineHeight,
      "letter-spacing": stepConfig.letterSpacing,
    };

    for (const [property, value] of Object.entries(propertiesToValidate)) {
      const validationRule = cssStepsValidation[property as CssStepsProperties];
      if (value === undefined) continue;

      if (validationRule?.(value.toString())) {
        stepOutput[stepsPropertyMap[property as CssStepsProperties]] = value.toString();
      } else {
        logWarning(`Invalid ${property} value "${value}" in @${stepName}. Skipping.`);
      }
    }

    parsedSteps[stepName] = stepOutput;
  }

  return parsedSteps;
}

type CssOptsProperties = "scale" | "font-size" | "line-height" | "prefix" | "rounded" | "emit";
type CssOptsValidation = Record<CssOptsProperties, (value: string) => boolean>;

const cssOptsValidation: CssOptsValidation = {
  "font-size": (value) => !!Number(value) || isValidFontSize(value),
  "line-height": (value) => !!Number(value) || isValidLineHeight(value),
  scale: (value) => !!Number(value),
  prefix: (value) => value.trim().length > 0,
  rounded: (value) => ["true", "false"].includes(value.toLowerCase()),
  emit: (value) => value.toLowerCase() === "variables",
};
/**
 * Extract TypeScaler options from an AtRule
 */
export function parseCssOptions(atRule: AtRule): TypeScalerOptions {
  const options: TypeScalerOptions = {};

  atRule.each((node) => {
    if (node.type !== "decl") return;

    const { prop, value } = node;

    if (!(prop in cssOptsValidation)) {
      logWarning(`Unknown property "${prop}" in @typescaler rule.`);
      return;
    }

    if (!cssOptsValidation[prop as CssOptsProperties](value)) {
      logWarning(`Invalid value "${value}" for property "${prop}".`);
      return;
    }

    switch (prop) {
      case "font-size":
        options.fontSize = value;
        break;
      case "scale":
        options.scale = parseFloat(value);
        break;
      case "line-height":
        options.lineHeight = value;
        break;
      case "prefix":
        options.prefix = value.replace(/[^a-zA-Z0-9_-]/g, "");
        break;
      case "rounded":
        options.rounded = value.toLowerCase() === "true";
        break;
      case "emit":
        if (value.toLowerCase() !== "variables") logWarning(`Only "variables" is supported at the moment.`);
        options.emit = "variables"; // TODO: Add support for other emit formats
        break;
    }
  });

  return options;
}

/**
 * Parse step configurations from an AtRule
 */
export function parseCssSteps(atRule: AtRule): Record<string, StepOutput> {
  const steps: Record<string, StepOutput> = {};

  atRule.walkAtRules((stepAtRule) => {
    const stepName = stepAtRule.name;
    const stepConfig = {} as StepOutput;

    // If there are params, parse them as shorthand
    if (stepAtRule.params) {
      const params = stepAtRule.params.trim().split(/\s+/);
      const shorthandProperties: CssStepsProperties[] = ["step", "line-height", "letter-spacing"];

      params.forEach((param, index) => {
        const property = shorthandProperties[index];
        const validationRule = cssStepsValidation[property];

        if (!validationRule) logWarning(`Unknown property "${property}" in @${stepName} rule.`);
        else if (validationRule(param)) stepConfig[stepsPropertyMap[property]] = param;
        else logWarning(`Invalid ${property} value "${param}" in @${stepName}. Skipping.`);
      });
    }
    // Otherwise parse declarations inside the rule
    else {
      stepAtRule.walkDecls(({ prop, value }) => {
        const validationRule = cssStepsValidation[prop as CssStepsProperties];

        if (!validationRule) logWarning(`Unknown property "${prop}" in @${stepName} rule.`);
        else if (validationRule(value)) stepConfig[stepsPropertyMap[prop as CssStepsProperties]] = value;
        else logWarning(`Invalid ${prop} value "${value}" in @${stepName}. Skipping.`);
      });
    }

    if (stepConfig.step === undefined) {
      stepConfig.step = 0; // Default value for a named step if not specified
      logWarning(`'step' not found for @${stepName}. Using default step 0.`);
    }

    steps[stepName] = stepConfig;
  });

  return steps;
}

function handleFontSizeParseError(value: string): number {
  logWarning(`Could not parse font-size value "${value}". Using ${DEFAULT_OPTIONS.fontSize}.`);
  return DEFAULT_OPTIONS.fontSize;
}

const UNIT_REGEX = /\d+(?:\.\d+)?([a-z]+)?$/;

export function parseFontSize(value: string | number): number {
  if (typeof value === "number") return value;

  const trimmedValue = value.trim().toLowerCase();
  const match = trimmedValue.match(UNIT_REGEX);

  if (!match) return handleFontSizeParseError(value);

  const numValue = parseFloat(match[0]);
  const unit = match[1];

  switch (unit) {
    case "rem":
    case "em":
      return numValue * BASE_FONT_SIZE;
    case undefined:
    case "px":
      return numValue;
    default:
      return handleFontSizeParseError(value);
  }
}
