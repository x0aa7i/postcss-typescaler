export interface TypeScalerLevelConfig {
  step: number;
  lineHeight?: string | number; // e.g., 1.4 (ratio), "2rem" (fixed CSS value), "24px"
}

export interface TypeScalerOptions {
  /**
   * Font size in pixels or other units. This value also determines the px value equivalent of 1rem.
   * @default 16
   */
  fontSize?: number | string;
  /**
   * Ratio for scaling font sizes.
   * @default 1.2
   */
  ratio?: number;
  /**
   * Base line height value. Unitless values are treated as absolute rem values in the output.
   * @default 1.5
   */
  lineHeight?: number;
  /**
   * A separate ratio for scaling line heights (not used for unitless/rem line heights in current logic).
   */
  heightRatio?: number;
  /**
   * Prefix for output CSS custom properties.
   * @default "text"
   */
  outputPrefix?: string;
  /**
   * Whether to round generated rem values (assumed to mean rounding decimal places).
   * @default true
   */
  roundToPx?: boolean;
  /**
   * Whether to generate CSS variables (tailwind v4 config style). If false, no CSS is generated.
   * @default true
   **/
  tailwindConfig?: boolean;
  /**
   * Configuration for different level scales (JS options). Levels in CSS @typescaler override these.
   */
  levels?: Record<string, number | TypeScalerLevelConfig>;
}
