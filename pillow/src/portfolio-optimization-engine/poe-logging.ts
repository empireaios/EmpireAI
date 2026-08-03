/** X2-16 — Portfolio Optimization Engine logging. */

import type { PortfolioOptimizationEngineConfiguration } from "./configuration.js";
import type { OptimizationLogEntry } from "./types.js";

const logs: OptimizationLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|ssn|bank[_-]?account)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive enterprise or credential data omitted]";
  }
  return details;
}

export function appendPoeLog(input: {
  event: string;
  level: OptimizationLogEntry["level"];
  details: string;
}): OptimizationLogEntry {
  const entry: OptimizationLogEntry = {
    logId: `poe-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getPoeLogs(
  limit = 50,
  config?: PortfolioOptimizationEngineConfiguration,
): OptimizationLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetPoeLogsForTesting(): void {
  logs.length = 0;
}
