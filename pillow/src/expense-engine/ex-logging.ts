/** R3-05 — Expense Engine logging. */

import type { ExpenseEngineConfiguration } from "./configuration.js";
import type { ExpenseLogEntry } from "./types.js";

const logs: ExpenseLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|account[_-]?number|iban|routing|ssn|card)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive financial value omitted]";
  }
  return details;
}

export function appendExLog(input: {
  event: string;
  level: ExpenseLogEntry["level"];
  details: string;
}): ExpenseLogEntry {
  const entry: ExpenseLogEntry = {
    logId: `ex-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getExLogs(
  limit = 50,
  config?: ExpenseEngineConfiguration,
): ExpenseLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetExLogsForTesting(): void {
  logs.length = 0;
}
