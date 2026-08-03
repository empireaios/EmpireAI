/** X4-08 — International Logistics Engine logging. */

import type { InternationalLogisticsEngineConfiguration } from "./configuration.js";
import type { IleLogEntry } from "./types.js";

const logs: IleLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|operational[_-]?secret|tracking[_-]?number|account[_-]?number|warehouse[_-]?code)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive operational data omitted]";
  }
  return details;
}

export function appendIleLog(input: {
  event: string;
  level: IleLogEntry["level"];
  details: string;
}): IleLogEntry {
  const entry: IleLogEntry = {
    logId: `ile-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getIleLogs(
  limit = 50,
  config?: InternationalLogisticsEngineConfiguration,
): IleLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetIleLogsForTesting(): void {
  logs.length = 0;
}
