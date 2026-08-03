/** X3-12 — Performance Preservation Engine logging. */

import type { PerformancePreservationEngineConfiguration } from "./configuration.js";
import type { PpeLogEntry } from "./types.js";

const logs: PpeLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|payroll|ssn|salary|wage|operational[_-]?secret|bank[_-]?account|customer[_-]?pii)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive operational or credential data omitted]";
  }
  return details;
}

export function appendPpeLog(input: {
  event: string;
  level: PpeLogEntry["level"];
  details: string;
}): PpeLogEntry {
  const entry: PpeLogEntry = {
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
  config?: PerformancePreservationEngineConfiguration,
): PpeLogEntry[] {
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
