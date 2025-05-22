/**
 * Defines configuration options for individual text steps (e.g., 'sm', 'lg').
 */
export interface TypeStep {
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
 * A map of step names (e.g., 'sm', 'base', 'xl') to their type step configurations.
 */
export type TypeStepsMap = Record<string, TypeStep>;

/**
 * The normalized and validated configuration for a single type step,
 * used internally after merging defaults and parsing all inputs.
 */
export interface NormalizedTypeStep {
  step?: number;
  fontSize?: string;
  lineHeight?: string;
  letterSpacing?: string;
}

export type NormalizedTypeStepsMap = Record<string, NormalizedTypeStep>;

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
   * If `true`, calculated pixel font sizes will be rounded to the nearest whole number.
   * @default true
   */
  rounded?: boolean;
  /**
   * Adjusts all font size steps by this offset, including those from `steps` and `preset`.
   * Positive values increase, negative values decrease the scale.
   * @default 0
   */
  stepOffset?: number;
  /**
   * A preset name to use for the default step configurations.
   * @default undefined
   */
  preset?: string | "tailwind";
  /**
   * A map of step names (e.g., 'sm', 'base', 'xl') to their configuration options.
   * Step values can be provided as a direct number shorthand or a detailed object.
   * These settings serve as defaults or fallbacks if no corresponding
   * steps are defined directly in your CSS.
   * @default "A set of Tailwind-like font sizes (xs, sm, base, lg, etc.)"
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
  steps?: Record<string, TypeStep | number>;
}

/**
 * The normalized and validated configuration for the plugin,
 * used internally after merging defaults and parsing all inputs.
 * All properties are guaranteed to be present with their final types.
 */
export interface NormalizedPluginOptions {
  scale: number;
  stepOffset: number;
  fontSize: number; // fontSize will be converted to a number (px)
  lineHeight: string;
  prefix: string;
  preset?: "tailwind" | "default";
  rounded: boolean;
}
