/** X1-14 — First Revenue Optimizer logging. */

import type { FirstRevenueOptimizerConfiguration } from "./configuration.js";
import type { RevenueLogEntry } from "./types.js";

const logs: RevenueLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|card[_-]?number|bank[_-]?account)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive financial or credential information omitted]";
  }
  return details;
}

export function appendFroLog(input: {
  event: string;
  level: RevenueLogEntry["level"];
  details: string;
}): RevenueLogEntry {
  const entry: RevenueLogEntry = {
    logId: `fro-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getFroLogs(
  limit = 50,
  config?: FirstRevenueOptimizerConfiguration,
): RevenueLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetFroLogsForTesting(): void {
  logs.length = 0;
}
