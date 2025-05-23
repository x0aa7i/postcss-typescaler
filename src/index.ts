import type { PluginOptions } from "./types.js";
import type { Plugin } from "postcss";

import { getPresetSteps } from "./constants.js";
import { generateStepsDeclarations } from "./generator.js";
import { clearLogs, getLogs } from "./log.js";
import { normalizeOptions, normalizeTypeSteps } from "./normalizer.js";
import { parseCssOptions, parseCssTypeSteps, parseJsTypeSteps } from "./parser.js";
import { deepMerge } from "./utils.js";

function postcssTypescaler(options: PluginOptions = {}): Plugin {
  return {
    postcssPlugin: "postcss-typescaler",
    AtRule: {
      typescaler(atRule, { result }) {
        const parent = atRule.parent; // Check if the rule is in a valid container to insert declarations

        if (!parent || !parent.nodes) {
          atRule.warn(
            result,
            `@typescaler rule found without a valid parent node. Skipping processing and removing rule.`
          );
          atRule.remove();
          return;
        }

        const { steps: jsSteps, ...jsOptions } = options;
        const pluginOptions = { ...jsOptions, ...parseCssOptions(atRule) };

        const typeSteps = deepMerge(
          parseJsTypeSteps(jsSteps),
          getPresetSteps(pluginOptions.preset),
          parseCssTypeSteps(atRule)
        );

        const declarations = generateStepsDeclarations(
          normalizeOptions(pluginOptions),
          normalizeTypeSteps(typeSteps)
        );

        parent.insertBefore(atRule, declarations);
        atRule.remove();

        for (const log of getLogs()) {
          atRule.warn(result, ...log);
        }

        clearLogs();
      },
    },
  };
}

postcssTypescaler.postcss = true;

export default postcssTypescaler;
export type { PluginOptions };
