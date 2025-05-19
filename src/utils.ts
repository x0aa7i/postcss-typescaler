export function logWarning(...messages: string[]): void {
  console.warn(`[postcss-typescaler]: ${messages.join(" ")}`);
}

export function isEmptyObject(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).length === 0;
}

export function roundNumber(value: number, precision: number = 3): number {
  return parseFloat(value.toFixed(precision));
}

export function isValidFontSize(value: string): boolean {
  const pattern =
    /^(\d+(\.\d+)?(px|em|rem|ex|ch|vw|vh|vmin|vmax|%))|(small|medium|large|x-large|xx-large|smaller|larger|initial|inherit)$/i;

  return pattern.test(value.trim());
}

export function isValidLetterSpacing(value: string): boolean {
  const pattern = /^([-+]?\d+(\.\d+)?(px|em|rem|ex|ch|vw|vh|vmin|vmax))|normal$/i;
  return pattern.test(value.trim());
}

export function isValidLineHeight(value: string): boolean {
  const pattern = /^(\d+(\.\d+)?(px|em|rem|ex|ch|vw|vh|vmin|vmax|%))|(\d+(\.\d+)?)|normal$/i;
  return pattern.test(value.trim());
}

export function calculateScaledFontSize({
  fontSize,
  scale,
  step,
  rounded,
}: {
  fontSize: number;
  scale: number;
  step: number;
  rounded: boolean;
}): number {
  const value = fontSize * Math.pow(scale, step);
  return rounded ? Math.round(value) : roundNumber(value, 2);
}
