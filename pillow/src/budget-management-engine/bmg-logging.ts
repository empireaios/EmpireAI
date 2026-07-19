/** R3-14 — Budget Management Engine logging. */

import type { BudgetManagementEngineConfiguration } from "./configuration.js";
import type { BmgLogEntry } from "./types.js";

const logs: BmgLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|account[_-]?number|iban|routing|ssn|card)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive financial value omitted]";
  }
  return details;
}

export function appendBmgLog(input: {
  event: string;
  level: BmgLogEntry["level"];
  details: string;
}): BmgLogEntry {
  const entry: BmgLogEntry = {
    logId: `bmg-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getBmgLogs(
  limit = 50,
  config?: BudgetManagementEngineConfiguration,
): BmgLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetBmgLogsForTesting(): void {
  logs.length = 0;
}
