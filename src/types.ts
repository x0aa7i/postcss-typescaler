/**
 * Defines configuration options for individual text steps (e.g., 'sm', 'lg').
 * These can be set directly in PostCSS plugin configuration or via CSS at-rules.
 */
export interface StepOptions {
  /**
   * The step value on the modular scale. A positive number for larger text,
   * a negative number for smaller text.
   */
  step?: number;
  /**
   * An explicit font size (e.g., "16px", "1rem") that overrides the modular
   * scale calculation for this step. Unitless numbers are treated as pixels.
   */
  fontSize?: string | number;
  /**
   * The line height for this step. Can be a unitless number (e.g., `1.5`),
   * a pixel value (e.g., `"24px"`), or a `rem` value.
   */
  lineHeight?: string | number;
  /**
   * The letter spacing for this step. Accepts any valid CSS `letter-spacing` value.
   */
  letterSpacing?: string;
}

/**
 * A map of step names (e.g., 'sm', 'base', 'xl') to their configuration options.
 * Step values can be provided as a direct number shorthand or a detailed object.
 *
 * @example
 * // As a number shorthand:
 * // {
 * //   'sm': -1,
 * //   'lg': 1
 * // }
 *
 * // As a detailed object:
 * // {
 * //   'base': { step: 0, lineHeight: 1.5 },
 * //   'xl': { fontSize: "32px", letterSpacing: "0.01em" }
 * // }
 */
export type StepsObject = Record<string, StepOptions | number>;

/**
 * Configuration options for the TypeScaler plugin.
 * These options influence how font sizes are calculated and emitted.
 */
export interface PluginOptions {
  /**
   * The base value used for calculating font sizes on the modular scale.
   * A larger scale results in more pronounced size differences between steps.
   * @default 1.125
   */
  scale?: number;
  /**
   * The fundamental font size in pixels, serving as the base for all calculations.
   * Unitless numbers are treated as pixels.
   * @default 16
   */
  fontSize?: number | string;
  /**
   * The default line height applied to all steps unless overridden.
   * Can be a unitless number, a pixel value, or a `rem` value.
   * @default 1.5
   */
  lineHeight?: number | string;
  /**
   * A string prefix for generated CSS variables (e.g., `--text-[step]`).
   * @default "text"
   */
  prefix?: string;
  /**
   * Specifies the output format of the plugin. Currently, only `"variables"` is supported,
   * which generates CSS custom properties (variables).
   * @default "variables"
   */
  emit?: "variables";
  /**
   * If `true`, calculated pixel font sizes will be rounded to the nearest whole number.
   * @default true
   */
  rounded?: boolean;
  /**
   * Defines a set of named text steps and their configurations.
   * These settings serve as defaults or fallbacks if no corresponding
   * steps are defined directly in your CSS.
   * @default "A set of Tailwind-like font sizes (xs, sm, base, lg, etc.)"
   */
  steps?: StepsObject;
}

/**
 * The normalized and validated configuration for the plugin,
 * used internally after merging defaults and parsing all inputs.
 * All properties are guaranteed to be present with their final types.
 */
export interface NormalizedPluginOptions {
  scale: number;
  // fontSize will be converted to a number (px)
  fontSize: number;
  // lineHeight will be converted to a number (unitless) or kept as a string (px/rem/em)
  lineHeight: number | string;
  prefix: string;
  emit: "variables";
  rounded: boolean;
}

/**
 * A map of step names to their fully normalized and validated configuration,
 * used internally by the plugin.
 */
export type NormalizedStepsObject = Record<string, StepOptions>;

/**
 * The normalized and validated configuration for a single step,
 * used internally after merging defaults and parsing all inputs.
 */
// export interface NormalizedStepOptions {
//   step?: number;
//   fontSize?: string | number;
//   lineHeight?: string;
//   letterSpacing?: string;
// }

/** Properties that can be set for a step via CSS at-rule (kebab-case, all strings). */
export type CssStepProperties = "step" | "font-size" | "line-height" | "letter-spacing";

/** Properties that can be set for the plugin via CSS at-rule (kebab-case, all strings). */
export type OptionsProperties = "scale" | "font-size" | "line-height" | "prefix" | "rounded" | "emit";

/**
 * Represents the raw string key-value pairs parsed directly from a CSS step configuration block.
 * Keys are kebab-case as found in CSS.
 */
export type CssStepOptions = {
  [key in CssStepProperties]?: string;
};

/**
 * Represents the raw string key-value pairs parsed directly from a top-level CSS plugin configuration.
 * Keys are kebab-case as found in CSS.
 */
export type CssPluginOptions = {
  [key in OptionsProperties]?: string;
};
