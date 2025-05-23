import type { PluginOptions, TypeStep, TypeStepsMap } from "./types.js";
import type { AtRule } from "postcss";

import { log } from "./log.js";
import { kebabToCamel } from "./utils.js";

type PluginOptionsKey = keyof PluginOptions;

const OPTIONS_PROPS: PluginOptionsKey[] = [
  "scale",
  "fontSize",
  "lineHeight",
  "prefix",
  "rounded",
  "stepOffset",
  "preset",
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
  stepOffset: (value) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  },
  preset: (value) => value.trim().replace(/['"]/g, "").toLowerCase(),
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
 * Parse plugin options from css
 */
export function parseCssOptions(atRule: AtRule): PluginOptions {
  const options: PluginOptions = {};

  atRule.each((node) => {
    if (node.type !== "decl" || node.prop.startsWith("--")) return;
    const prop = kebabToCamel(node.prop) as PluginOptionsKey;

    if (!OPTIONS_PROPS.includes(prop)) {
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
const STEPS_PROPS: TypeStepKey[] = ["step", "lineHeight", "letterSpacing", "fontSize"];

/**
 * Parse step configurations from an css steps
 */
export function parseCssTypeSteps(atRule: AtRule): TypeStepsMap {
  const steps: TypeStepsMap = {};

  atRule.walkDecls((node) => {
    if (!node.prop.startsWith("--")) return;
    const [name, property] = node.prop.slice(2).split("--");

    if (!steps[name]) steps[name] = {};
    const config: TypeStep = steps[name];

    if (property) {
      const prop = kebabToCamel(property) as TypeStepKey;

      if (!STEPS_PROPS.includes(prop)) {
        log(`Unknown property "${prop}" in ${node.prop}. Ignoring.`, { node });
        return;
      }

      const parsedValue = cssTypeStepParsers[prop]?.(node.value);
      if (parsedValue === undefined) {
        log(`Could not parse "${prop}" value "${node.value}" in @${name} step. Skipping.`, {
          node,
        });
        return;
      }

      config[prop] = parsedValue as any;
    } else {
      const params = node.value.trim().split(/\s+/);
      params.forEach((value, index) => {
        if (index >= 3) return;
        const prop = STEPS_PROPS[index];

        const parsedValue = cssTypeStepParsers[prop]?.(value);
        if (parsedValue === undefined) {
          log(`Could not parse "${prop}" value "${value}" in @${name} step. Skipping.`, { node });
          return;
        }

        config[prop] = parsedValue as any;
      });
    }
  });

  return steps;
}

export function parseJsTypeSteps(steps: PluginOptions["steps"]): TypeStepsMap {
  const parsedSteps: TypeStepsMap = {};

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
