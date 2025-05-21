import type { PluginOptions, TypeStep } from "./types.js";
import type { AtRule } from "postcss";

import { log } from "./log.js";
import { kebabToCamel } from "./utils.js";

type PluginOptionsKey = keyof PluginOptions;

const PLUGIN_OPTIONS_PROPS: PluginOptionsKey[] = ["scale", "fontSize", "lineHeight", "prefix", "rounded"];

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
    if (node.type !== "decl" || node.prop.startsWith("--")) return;

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

  atRule.each((node) => {
    if (node.type === "decl" && node.prop.startsWith("--")) {
      const name = node.prop.slice(2);
      const config: TypeStep = {};
      const params = node.value.trim().split(/\s+/);

      params.forEach((value, index) => {
        if (index >= SHORTHAND_PROPS.length) return;
        const prop = SHORTHAND_PROPS[index];

        const parsedValue = cssTypeStepParsers[prop]?.(value);
        if (parsedValue === undefined) {
          log(`Could not parse "${prop}" value "${value}" in @${name} step. Skipping.`, { node });
          return;
        }

        config[prop] = parsedValue as any;
      });

      steps[name] = config;
    } else if (node.type === "atrule") {
      const stepName = node.name;
      const config: TypeStep = {};

      node.walkDecls((decl) => {
        const prop = kebabToCamel(decl.prop) as TypeStepKey;

        if (!STEP_PROPS.includes(prop)) {
          log(`Unknown property "${decl.prop}" in @${stepName} step. Ignoring.`, { node: decl });
          return;
        }

        const parsedValue = cssTypeStepParsers[prop]?.(decl.value);
        if (parsedValue === undefined) {
          log(`Could not parse "${prop}" value "${decl.value}" in @${stepName} step. Skipping.`, {
            node: decl,
          });
          return;
        }

        config[prop] = parsedValue as any;
      });

      steps[stepName] = config;
    }
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
