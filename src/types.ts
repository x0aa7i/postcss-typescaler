export interface StepConfig {
  /**
   * The step value on the modular scale.
   * Required if the level is defined with a simple value (e.g., `sm: -1;`).
   * Optional if defined with a block (e.g., `xs { step: 0; ... }`),
   * in which case `fontSize` can be used instead.
   */
  step?: number;
  /**
   * An explicit font size for this level, overrides the modular scale calculation.
   * Can be a pixel value (e.g., "16px") or a unitless number (which will be treated as px).
   */
  fontSize?: string | number;
  /**
   * The line height for this level.
   * Can be a unitless number, px value (converted to unitless based on baseFontSize), or rem value.
   */
  lineHeight?: string | number;
  /**
   * The letter spacing for this level.
   * Can be any valid CSS letter-spacing value (px, em, rem, etc.).
   */
  letterSpacing?: string;
}

export interface StepOutput {
  step: number | string;
  fontSize?: string;
  lineHeight?: number | string;
  letterSpacing?: string;
}

export type TypeScalerStepsConfig = Record<string, StepConfig | number>;

export interface TypeScalerOptions {
  /**
   * The scale for calculating font sizes.
   * Corresponds to the `scale` declaration.
   * @default 1.125
   */
  scale?: number;
  /**
   * Font size in pixels, used as the base for calculating font sizes.
   * Corresponds to the `font-size` declaration.
   * @default 16
   */
  fontSize?: number | string;
  /**
   * Base line height value.
   * Used for levels that don't specify their own line height.
   * Can be a unitless number, px value (converted to unitless based on baseFontSize), or rem value.
   * Corresponds to the `line-height` declaration.
   * @default 1.5
   */
  lineHeight?: number | string;
  /**
   * The prefix for the generated CSS variables.
   * Corresponds to the `prefix` declaration.
   * @default "text"
   */
  prefix?: string;
  /**
   * The output format. Currently only supports "variables".
   * Corresponds to the `emit` declaration.
   * @default "variables"
   */
  emit?: "variables";
  /**
   * Whether to round calculated pixel font sizes to the nearest whole number.
   * Corresponds to the `rounded` declaration.
   * @default true
   */
  rounded?: boolean;
  /**
   * Level configurations.
   * This serves as a fallback if no `steps` rule is found in the CSS.
   * @default tailwind font sizes
   */
  steps?: TypeScalerStepsConfig;
}
