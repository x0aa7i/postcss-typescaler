import type { TypeScalerOptions } from "./types.js";
import type { AtRule, Container, Plugin } from "postcss";

import { DEFAULT_OPTIONS, DEFAULT_STEPS } from "./constants.js";
import { generateStepsDeclarations } from "./generator.js";
import { parseConfigSteps, parseCssOptions, parseCssSteps, parseFontSize } from "./parser.js";
import { isEmptyObject, logWarning } from "./utils.js";

function postcssTypescaler(options: TypeScalerOptions = {}): Plugin {
  return {
    postcssPlugin: "postcss-typescaler",
    AtRule: {
      typescaler(atRule: AtRule) {
        const parent = atRule.parent as Container | undefined; // Check if the rule is in a valid container to insert declarations

        if (!parent || !parent.nodes) {
          logWarning(
            `@typescaler rule found without a valid parent node in ${atRule.source?.input.file || "CSS source"}.`,
            "Skipping processing and removing rule."
          );
          atRule.remove();
          return;
        }

        const ruleOptions = { ...options, ...parseCssOptions(atRule) };
        const ruleSteps = parseCssSteps(atRule);
        const defaultSteps = options.steps ?? DEFAULT_STEPS;
        const steps = !isEmptyObject(ruleSteps) ? ruleSteps : parseConfigSteps(defaultSteps);

        const {
          scale = DEFAULT_OPTIONS.scale,
          fontSize = DEFAULT_OPTIONS.fontSize,
          lineHeight = DEFAULT_OPTIONS.lineHeight,
          prefix = DEFAULT_OPTIONS.prefix,
          rounded = DEFAULT_OPTIONS.rounded,
          emit = DEFAULT_OPTIONS.emit,
        } = ruleOptions;

        const declarations = generateStepsDeclarations(steps, {
          fontSize: parseFontSize(fontSize),
          scale,
          lineHeight,
          prefix,
          rounded,
          emit,
        });

        parent.insertBefore(atRule, declarations);
        atRule.remove();
      },
    },
  };
}

postcssTypescaler.postcss = true;

export default postcssTypescaler;
