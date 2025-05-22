import type { NormalizedPluginOptions, NormalizedTypeStep, NormalizedTypeStepsMap } from "./types.js";

import { Declaration } from "postcss";

import { BASE_FONT_SIZE } from "./constants.js";
import { roundFloat } from "./utils.js";

/**
 * Generate declarations for all typography steps
 */
export function generateStepsDeclarations(options: NormalizedPluginOptions, steps: NormalizedTypeStepsMap) {
  const declarations: Declaration[] = [];

  for (const [stepName, stepConfig] of Object.entries(steps)) {
    const fontSize = getFontSizeValue(stepConfig, options);
    if (!fontSize) continue;

    declarations.push(
      ...createVariableDeclarations({
        prefix: options.prefix,
        stepName,
        fontSize,
        lineHeight: stepConfig.lineHeight ?? options.lineHeight,
        letterSpacing: stepConfig.letterSpacing,
      })
    );
  }

  return declarations;
}

// get the css variable declarations for a given step
function createVariableDeclarations({
  prefix,
  stepName,
  fontSize,
  lineHeight,
  letterSpacing,
}: {
  prefix: string;
  stepName: string;
  fontSize: string;
  lineHeight: string;
  letterSpacing?: string;
}): Declaration[] {
  const declarations = [
    new Declaration({ prop: `--${prefix}-${stepName}`, value: fontSize }),
    new Declaration({ prop: `--${prefix}-${stepName}--line-height`, value: lineHeight }),
  ];

  if (letterSpacing) {
    declarations.push(
      new Declaration({ prop: `--${prefix}-${stepName}--letter-spacing`, value: letterSpacing })
    );
  }

  return declarations;
}

function getFontSizeValue(type: NormalizedTypeStep, opts: NormalizedPluginOptions): string | undefined {
  if (type.fontSize) return type.fontSize;
  if (type.step === undefined) return undefined; // should not happen, we check for this in the normalizer

  // font size in px
  const fontSize = opts.fontSize * Math.pow(opts.scale, type.step + opts.stepOffset);
  const rounded = opts.rounded ? Math.round(fontSize) : roundFloat(fontSize, 2);

  return `${roundFloat(rounded / BASE_FONT_SIZE)}rem /* ${rounded}px */`;
}
