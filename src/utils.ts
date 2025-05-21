export function isEmptyObject(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).length === 0;
}

export function roundFloat(value: number, precision: number = 3): number {
  return parseFloat(value.toFixed(precision));
}

export function isNumeric(value?: string | number): boolean {
  return !isNaN(Number(value));
}

export function typedEntries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

export function kebabToCamel(s: string): string {
  return s.replace(/-(.)/g, (_, char) => char.toUpperCase());
}
