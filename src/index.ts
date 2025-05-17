import type { AtRule, Container, Plugin } from "postcss";
import type { TypeScalerLevelConfig, TypeScalerOptions } from "./types.js";

import { Declaration } from "postcss";

const DEFAULT_OPTIONS = {
  fontSize: 16,
  ratio: 1.125,
  lineHeight: 1.5,
  outputPrefix: "text",
  roundToPx: true,
  tailwindConfig: true,
} satisfies TypeScalerOptions;

const DEFAULT_LEVELS = {
  xs: { step: -2 },
  sm: { step: -1 },
  base: { step: 0 },
  md: { step: 0 }, // Alias for base
  lg: { step: 1 },
  xl: { step: 2 },
  "2xl": { step: 3 },
  "3xl": { step: 4 },
  "4xl": { step: 5 },
  "5xl": { step: 6 },
  "6xl": { step: 7 },
  "7xl": { step: 8 },
} satisfies Record<string, TypeScalerLevelConfig>;

function postcssTypescaler(options: TypeScalerOptions = {}): Plugin {
  return {
    postcssPlugin: "postcss-typescaler",
    AtRule: {
      typescaler(atRule: AtRule) {
        const parent = atRule.parent as Container | undefined; // Check if the rule is in a valid container to insert declarations

        if (!parent || !parent.nodes) {
          warn(
            `@typescaler rule found without a valid parent node in ${atRule.source?.input.file || "CSS source"}.`,
            "Skipping processing and removing rule.",
          );
          atRule.remove();
          return;
        }

        const collectedOptions = { ...options, ...collectOptions(atRule) };
        const collectedLevels = collectLevels(atRule);
        const levels = Object.keys(collectedLevels).length
          ? collectedLevels
          : ((options.levels ?? DEFAULT_LEVELS) as Record<string, TypeScalerLevelConfig>);

        const {
          fontSize = DEFAULT_OPTIONS.fontSize,
          ratio = DEFAULT_OPTIONS.ratio,
          lineHeight = DEFAULT_OPTIONS.lineHeight,
          outputPrefix = DEFAULT_OPTIONS.outputPrefix,
          roundToPx = DEFAULT_OPTIONS.roundToPx,
          tailwindConfig = DEFAULT_OPTIONS.tailwindConfig,
        } = collectedOptions;

        const basePx = parseUnitlessOrPxValue(fontSize);
        const declarations: Declaration[] = [];

        for (const levelName in levels) {
          const levelConf = levels[levelName];
          const { step, lineHeight: levelLineHeight } = parseLevelConfig(levelConf);

          if (step === undefined || isNaN(parseFloat(step.toString()))) {
            warn(
              `Skipping @level "${levelName}" due to invalid 'step' in ${atRule.source?.input.file || "CSS source"}.`,
            );
            continue;
          }

          const fontSizePx = calculateFontSize({ basePx, ratio, step, roundToPx });
          const lineHeightValue =
            parseUnitlessOrLengthValue({ value: levelLineHeight, basePx }) ?? lineHeight;

          if (tailwindConfig) {
            declarations.push(
              ...getTailwindDeclaration({
                levelName,
                basePx,
                fontSizePx,
                lineHeight: lineHeightValue,
                outputPrefix,
              }),
            );
          } else {
            warn(`Only tailwind config is supported at the moment. Skipping @level "${levelName}".`);
          }
        }

        parent.insertBefore(atRule, declarations);
        atRule.remove();
      },
    },
  };
}

// get the css declarations for a given level
function getTailwindDeclaration({
  levelName,
  basePx,
  fontSizePx,
  lineHeight,
  outputPrefix,
}: {
  levelName: string;
  basePx: number;
  fontSizePx: number;
  lineHeight: number;
  outputPrefix: string;
}): Declaration[] {
  const fontSizeRem = parseFloat((fontSizePx / basePx).toFixed(3));

  return [
    new Declaration({
      prop: `--${outputPrefix}-${levelName}`,
      value: `${fontSizeRem}rem /* ${fontSizePx}px */`,
    }),
    new Declaration({
      prop: `--${outputPrefix}-${levelName}--line-height`,
      value: lineHeight.toString(),
    }),
  ];
}

function calculateFontSize({
  basePx,
  ratio,
  step,
  roundToPx,
}: {
  basePx: number;
  ratio: number;
  step: number;
  roundToPx: boolean;
}): number {
  const fontSizePx = basePx * Math.pow(ratio, step);
  return roundToPx ? Math.round(fontSizePx) : fontSizePx;
}

function parseUnitlessOrPxValue(value: string | number): number {
  if (typeof value === "number") return value;

  const numericValue = parseFloat(value.toString().trim());
  if (isNaN(numericValue)) {
    warn(`Could not parse font-size value "${value}". Using 16.`);
    return 16;
  }

  return Number(numericValue.toFixed(2));
}

function parseUnitlessOrLengthValue({
  value,
  basePx,
}: {
  value: string | number;
  basePx: number;
}): number | undefined {
  if (typeof value === "number") return value;

  const valueStr = value.toString().trim().toLowerCase();
  const numValue = parseFloat(valueStr);

  if (isNaN(numValue)) {
    warn(`Could not parse line height number from "${value}".`);
    return undefined;
  }

  if (valueStr.endsWith("rem") || !valueStr.match(/[a-z]/)) return numValue;
  if (valueStr.endsWith("px")) return parseFloat((numValue / basePx).toFixed(3));

  warn(`Could not parse line height value "${value}". Invalid unit or format.`);
  return undefined;
}

function collectOptions(atRule: AtRule): TypeScalerOptions {
  const options: TypeScalerOptions = {};

  atRule.walkDecls(({ prop, value }) => {
    switch (prop) {
      case "font-size":
        options.fontSize = value;
        break;
      case "ratio":
        options.ratio = parseFloat(value);
        break;
      case "line-height":
        options.lineHeight = parseFloat(value);
        break;
      case "output-prefix":
        options.outputPrefix = value.replace(/['"]/g, ""); // Remove quotes
        break;
      case "round-to-px":
        options.roundToPx = value.toLowerCase() === "true";
        break;
      case "tailwind-config":
        options.tailwindConfig = value.toLowerCase() === "true";
        break;
    }
  });

  return options;
}

function collectLevels(atRule: AtRule): Record<string, TypeScalerLevelConfig> {
  const levels: Record<string, TypeScalerLevelConfig> = {};

  atRule.walkAtRules("level", (levelAtRule) => {
    const levelName = levelAtRule.params.trim();

    if (!levelName) {
      warn(`Skipping @level rule with no name in ${atRule.source?.input.file || "CSS source"}.`);
      return;
    }

    const levelConfig: TypeScalerLevelConfig = {} as TypeScalerLevelConfig;

    levelAtRule.walkDecls(({ prop, value }) => {
      if (prop === "step") levelConfig.step = parseFloat(value);
      if (prop === "line-height") levelConfig.lineHeight = value;
    });

    if (levelConfig.step === undefined) {
      levelConfig.step = 0; // Default step for a named level if not specified
      warn(`'step' not found for @level "${levelName}". Using default step 0.`);
    }

    levels[levelName] = levelConfig;
  });

  return levels;
}

function parseLevelConfig(levelConf: TypeScalerLevelConfig | number): {
  step: number;
  lineHeight: string | number;
} {
  let step: number | undefined;
  let lineHeight: string | number;

  if (typeof levelConf === "number") {
    step = levelConf;
    lineHeight = DEFAULT_OPTIONS.lineHeight;
  } else {
    step = levelConf.step ?? 0;
    lineHeight = levelConf.lineHeight ?? DEFAULT_OPTIONS.lineHeight;
  }

  return { step, lineHeight };
}

export function warn(...messages: string[]) {
  console.warn(`[postcss-typescaler]: ${messages.join(" ")}`);
}

postcssTypescaler.postcss = true;

export default postcssTypescaler;

// usage:
// @typescaler {
//   font-size: 16;
//   ratio: 1.2;
//   output-prefix: "text";
//   round-to-px: true;
//   tailwind-config: true;
//
//   @level sm {
//     step: -1;
//     line-height: 1.4;
//   }
//   @level md {
//     step: 0;
//   }
//   @level lg {
//     step: 1;
//   }
// }
//
// output: // this is using tailwindcss style (v4) when tailwind-config: true
// :root {
//   --text-sm: 0.8rem;
//   --text-sm--line-height: 1.4rem;
//   --text-md: 1rem;
//   --text-md--line-height: 1.5rem;
//   --text-lg: 1.2rem;
//   --text-lg--line-height: 1.6rem;
// }
//
// tailwindcss config: false might look like this:
// {
//   "text-sm": {
//     "font-size": "0.8rem",
//     "line-height": "1.4rem"
//   },
//   "text-md": {
//     "font-size": "1rem",
//     "line-height": "1.5rem"
//   },
//   "text-lg": {
//     "font-size": "1.2rem",
//     "line-height": "1.6rem"
//   }
// }
