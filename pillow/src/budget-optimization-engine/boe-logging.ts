/** R5-13 — Budget Optimization Engine logging. */

import type { BudgetOptimizationEngineConfiguration } from "./configuration.js";
import type { BudgetLogEntry } from "./types.js";

const logs: BudgetLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive advertising credential omitted]";
  }
  return details;
}

export function appendBoeLog(input: {
  event: string;
  level: BudgetLogEntry["level"];
  details: string;
}): BudgetLogEntry {
  const entry: BudgetLogEntry = {
    logId: `boe-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getBoeLogs(
  limit = 50,
  config?: BudgetOptimizationEngineConfiguration,
): BudgetLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetBoeLogsForTesting(): void {
  logs.length = 0;
}
