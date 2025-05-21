import type { PluginOptions, TypeStep } from "./types.js";
import type { AtRule } from "postcss";

import { log } from "./log.js";
import { kebabToCamel } from "./utils.js";

type PluginOptionsKey = keyof PluginOptions;

const PLUGIN_OPTIONS_PROPS: PluginOptionsKey[] = [
  "scale",
  "fontSize",
  "lineHeight",
  "prefix",
  "rounded",
  "emit",
];

type Parsers<T> = {
  [K in keyof T]?: (value: string) => T[K] | undefined;
};

const cssOptionsParsers: Parsers<PluginOptions> = {
  scale: (value) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  },
  fontSize: (value) => {
    const numericValue = Number(value.trim());
    return isNaN(numericValue) ? value.trim() || undefined : numericValue;
  },
  lineHeight: (value) => value.trim(),
  prefix: (value) => value.trim(),
  rounded: (value) => value.toLowerCase() === "true",
  emit: (value) => (value.toLowerCase().replace(/['"]/g, "") === "variables" ? "variables" : undefined),
};

const cssTypeStepParsers: Parsers<TypeStep> = {
  step: parseFloat,
  fontSize: (value) => {
    if (!isNaN(parseFloat(value)) && String(parseFloat(value)) === value) {
      return parseFloat(value); // Return number if it's a simple number string
    }
    return value.trim();
  },
  lineHeight: (value) => value.trim(),
  letterSpacing: (value) => value.trim(),
};

/**
 * Parse plugin options from an css
 */
export function parseCssOptions(atRule: AtRule): PluginOptions {
  const options: PluginOptions = {};

  atRule.each((node) => {
    if (node.type !== "decl") return;
    const prop = kebabToCamel(node.prop) as PluginOptionsKey;

    if (!PLUGIN_OPTIONS_PROPS.includes(prop)) {
      log(`Unknown property "${node.prop}" in @typescaler rule. Skipping.`, { node });
      return;
    }

    const parsedValue = cssOptionsParsers[prop]?.(node.value);
    if (parsedValue === undefined) {
      log(`Could not parse "${prop}" value "${node.value}". Skipping.`, { node });
      return;
    }

    options[prop] = parsedValue as any;
  });

  return options;
}

type TypeStepKey = keyof TypeStep;
const STEP_PROPS: TypeStepKey[] = ["step", "fontSize", "lineHeight", "letterSpacing"];
const SHORTHAND_PROPS: TypeStepKey[] = ["step", "lineHeight", "letterSpacing"];

/**
 * Parse step configurations from an css steps
 */
export function parseCssTypeSteps(atRule: AtRule): Record<string, TypeStep> {
  const steps: Record<string, TypeStep> = {};

  atRule.walkAtRules((node) => {
    const stepName = node.name;
    const stepOpts: Record<string, TypeStep> = {};

    // If there are params, parse them as shorthand
    if (node.params) {
      const params = node.params.trim().split(/\s+/);

      params.forEach((value, index) => {
        const prop = SHORTHAND_PROPS[index];

        if (!prop) {
          log(`Unknown property at index "${index}" in @${stepName} step. Ignoring.`, { node });
          return;
        }

        const parsedValue = cssTypeStepParsers[prop]?.(value);
        if (parsedValue === undefined) {
          log(`Could not parse "${prop}" value "${value}" in @${stepName} step. Skipping.`, { node });
          return;
        }

        stepOpts[prop] = parsedValue as any;
      });
    }
    // Otherwise parse declarations inside the rule
    else {
      node.walkDecls((node) => {
        const prop = kebabToCamel(node.prop) as TypeStepKey;

        if (!STEP_PROPS.includes(prop)) {
          log(`Unknown property "${node.prop}" in @${stepName} step. Ignoring.`, { node });
          return;
        }

        const parsedValue = cssTypeStepParsers[prop]?.(node.value);
        if (parsedValue === undefined) {
          log(`Could not parse "${prop}" value "${node.value}" in @${stepName} step. Skipping.`, { node });
          return;
        }
        stepOpts[prop] = parsedValue as any;
      });
    }

    steps[stepName] = stepOpts;
  });

  return steps;
}

export function parseJsTypeSteps(steps: PluginOptions["steps"]): Record<string, TypeStep> {
  const parsedSteps: Record<string, TypeStep> = {};

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
