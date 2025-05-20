import type { NormalizedStepOptions } from "./types.js";

import { Declaration } from "postcss";

import { BASE_FONT_SIZE, DEFAULT_OPTIONS } from "./constants.js";
import { calculateScaledFontSize, logWarning, roundNumber } from "./utils.js";

/**
 * Generate declarations for all typography steps
 */
export function generateStepsDeclarations(
  steps: Record<string, NormalizedStepOptions>,
  options: {
    fontSize: number;
    scale: number;
    lineHeight: number | string;
    prefix: string;
    rounded: boolean;
    emit: string;
  }
) {
  const declarations: Declaration[] = [];

  for (const stepName in steps) {
    const stepConfig = steps[stepName];
    const step = typeof stepConfig.step === "number" ? stepConfig.step : parseFloat(stepConfig.step);

    if (isNaN(step)) {
      // should not happen, but just in case
      logWarning(`Skipping @"${stepName}" due to invalid 'step' value.`);
      continue;
    }

    const fontSize = calculateScaledFontSize({
      step,
      fontSize: options.fontSize,
      scale: options.scale,
      rounded: options.rounded,
    });

    if (options.emit === "variables") {
      declarations.push(
        ...createVariableDeclarations({
          stepName,
          fontSize,
          stepConfig,
          prefix: options.prefix,
        })
      );
    } else {
      // This should not happen, but just in case
      // TODO: Add support for other emit formats
      logWarning(`Only css variables is supported at the moment. Skipping @"${stepName}".`);
    }
  }

  return declarations;
}

// get the css variable declarations for a given step
function createVariableDeclarations({
  stepName,
  stepConfig,
  fontSize,
  prefix,
}: {
  stepName: string;
  stepConfig: NormalizedStepOptions;
  fontSize: number;
  prefix: string;
}): Declaration[] {
  const fontSizeValue = stepConfig.fontSize ?? roundNumber(fontSize / BASE_FONT_SIZE);
  const fontSizeComment = stepConfig.fontSize ? "" : ` /* ${fontSize}px */`;
  const lineHeightValue = stepConfig.lineHeight ?? DEFAULT_OPTIONS.lineHeight;

  return [
    new Declaration({
      prop: `--${prefix}-${stepName}`,
      value: `${fontSizeValue}rem${fontSizeComment}`,
    }),
    new Declaration({
      prop: `--${prefix}-${stepName}--line-height`,
      value: lineHeightValue.toString(),
    }),
    ...(stepConfig.letterSpacing
      ? [
          new Declaration({
            prop: `--${prefix}-${stepName}--letter-spacing`,
            value: stepConfig.letterSpacing.toString(),
          }),
        ]
      : []),
  ];
}
