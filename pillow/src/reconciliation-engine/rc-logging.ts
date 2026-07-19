/** R3-08 — Reconciliation Engine logging. */

import type { ReconciliationEngineConfiguration } from "./configuration.js";
import type { ReconciliationLogEntry } from "./types.js";

const logs: ReconciliationLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|account[_-]?number|iban|routing|ssn|card)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive financial value omitted]";
  }
  return details;
}

export function appendRcLog(input: {
  event: string;
  level: ReconciliationLogEntry["level"];
  details: string;
}): ReconciliationLogEntry {
  const entry: ReconciliationLogEntry = {
    logId: `rc-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getRcLogs(
  limit = 50,
  config?: ReconciliationEngineConfiguration,
): ReconciliationLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetRcLogsForTesting(): void {
  logs.length = 0;
}
