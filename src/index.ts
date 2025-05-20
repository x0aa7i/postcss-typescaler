import type { PluginOptions } from "./types.js";
import type { AtRule, Container, Plugin } from "postcss";

import { generateStepsDeclarations } from "./generator.js";
import { parseCssOptions, parseCssSteps, parseJsSteps } from "./parser.js";
import { logWarning } from "./utils.js";
import { validateOptions, validateSteps } from "./validation.js";

function postcssTypescaler(options: PluginOptions = {}): Plugin {
  const { steps: jsSteps, ...jsOptions } = options;

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

        const pluginOptions = { ...jsOptions, ...parseCssOptions(atRule) };
        const pluginSteps = { ...parseJsSteps(jsSteps), ...parseCssSteps(atRule) };

        const declarations = generateStepsDeclarations(
          validateSteps(pluginSteps),
          validateOptions(pluginOptions)
        );

        parent.insertBefore(atRule, declarations);
        atRule.remove();
      },
    },
  };
}

postcssTypescaler.postcss = true;

export default postcssTypescaler;
export type { PluginOptions };
