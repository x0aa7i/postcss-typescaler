export function logWarning(...messages: string[]): void {
  console.warn(`[postcss-typescaler]: ${messages.join(" ")}`);
}

export function isEmptyObject(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).length === 0;
}

export function roundNumber(value: number, precision: number = 3): number {
  return parseFloat(value.toFixed(precision));
}

export function isNumeric(value?: string | number): boolean {
  return !isNaN(Number(value));
}

export function typedEntries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
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
