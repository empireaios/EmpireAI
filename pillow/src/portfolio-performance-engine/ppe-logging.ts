/** X2-03 — Portfolio Performance Engine logging. */

import type { PortfolioPerformanceEngineConfiguration } from "./configuration.js";
import type { PerformanceLogEntry } from "./types.js";

const logs: PerformanceLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive enterprise credential omitted]";
  }
  return details;
}

export function appendPpeLog(input: {
  event: string;
  level: PerformanceLogEntry["level"];
  details: string;
}): PerformanceLogEntry {
  const entry: PerformanceLogEntry = {
    logId: `ppe-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getPpeLogs(
  limit = 50,
  config?: PortfolioPerformanceEngineConfiguration,
): PerformanceLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetPpeLogsForTesting(): void {
  logs.length = 0;
}
