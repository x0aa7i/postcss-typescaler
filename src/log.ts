type Log = [string, Record<string, any> | undefined];

const logs: Log[] = [];

export function log(message: string, options?: Record<string, any>): void {
  logs.push([message, options]);
}

export function getLogs(): readonly Log[] {
  return logs.slice();
}

export function clearLogs(): void {
  logs.length = 0;
}
