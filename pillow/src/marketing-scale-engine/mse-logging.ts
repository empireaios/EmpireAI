/** X3-05 — Marketing Scale Engine logging. */

import type { MarketingScaleEngineConfiguration } from "./configuration.js";
import type { MseLogEntry } from "./types.js";

const logs: MseLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|marketing[_-]?secret|ad[_-]?account[_-]?secret)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive marketing or credential data omitted]";
  }
  return details;
}

export function appendMseLog(input: {
  event: string;
  level: MseLogEntry["level"];
  details: string;
}): MseLogEntry {
  const entry: MseLogEntry = {
    logId: `mse-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getMseLogs(
  limit = 50,
  config?: MarketingScaleEngineConfiguration,
): MseLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetMseLogsForTesting(): void {
  logs.length = 0;
}
