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

type PlainObject = { [key: string]: any };

function isObject(value: any): value is PlainObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function deepMerge<T extends PlainObject[]>(...objects: T): T[0] {
  const result: PlainObject = {};

  for (const obj of objects) {
    for (const key of Object.keys(obj)) {
      const sourceValue = obj[key];
      const targetValue = result[key];

      if (isObject(sourceValue) && isObject(targetValue)) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else {
        result[key] = sourceValue;
      }
    }
  }

  return result as T[0];
}
