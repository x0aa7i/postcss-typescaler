import type {
  CssStepProperties,
  NormalizedStepsObject,
  PluginOptions,
  StepOptions,
  StepsObject,
} from "./types.js";
import type { AtRule } from "postcss";

import { BASE_FONT_SIZE, DEFAULT_OPTIONS } from "./constants.js";
import { logWarning } from "./utils.js";

/**
 * Parse plugin options from an css
 */
export function parseCssOptions(atRule: AtRule): PluginOptions {
  const options: PluginOptions = {};

  atRule.each((node) => {
    if (node.type !== "decl") return;
    const { prop, value } = node;

    switch (prop) {
      case "font-size":
        options.fontSize = parseFontSize(value);
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
        options.emit = "variables"; // TODO: Add support for other emit formats
        break;
      default:
        logWarning(`Unknown property "${prop}" in @typescaler rule.`);
    }
  });

  return options;
}

const STEP_PROPERTIES_MAP: Record<CssStepProperties, keyof StepOptions> = {
  step: "step",
  "font-size": "fontSize",
  "line-height": "lineHeight",
  "letter-spacing": "letterSpacing",
};

const SHORTHAND_PROPERTIES: CssStepProperties[] = ["step", "line-height", "letter-spacing"];

/**
 * Parse step configurations from an css steps
 */
export function parseCssSteps(atRule: AtRule): NormalizedStepsObject {
  const steps: NormalizedStepsObject = {};

  atRule.walkAtRules((stepAtRule) => {
    const stepName = stepAtRule.name;
    const stepOpts: Partial<StepOptions> = {};

    // If there are params, parse them as shorthand
    if (stepAtRule.params) {
      const params = stepAtRule.params.trim().split(/\s+/);

      params.forEach((value, index) => {
        const prop = SHORTHAND_PROPERTIES[index];
        if (prop) {
          const mappedProp = STEP_PROPERTIES_MAP[prop];
          stepOpts[mappedProp as keyof StepOptions] = value as any;
        }
      });
    }
    // Otherwise parse declarations inside the rule
    else {
      stepAtRule.walkDecls(({ prop, value }) => {
        const mappedProp = STEP_PROPERTIES_MAP[prop as CssStepProperties];
        if (mappedProp) {
          stepOpts[mappedProp as keyof StepOptions] = value as any;
        }
      });
    }

    steps[stepName] = stepOpts;
  });

  return steps;
}

export function parseJsSteps(steps?: StepsObject): NormalizedStepsObject {
  const parsedSteps: NormalizedStepsObject = {};
  if (!steps) return parsedSteps;

  for (const stepName in steps) {
    const stepOpts = steps[stepName];

    if (typeof stepOpts === "number") {
      parsedSteps[stepName] = { step: stepOpts };
      continue;
    }

    parsedSteps[stepName] = stepOpts;
  }

  return parsedSteps;
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
