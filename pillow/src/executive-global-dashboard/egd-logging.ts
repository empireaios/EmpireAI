/** X4-10 — Executive Global Dashboard logging. */

import type { ExecutiveGlobalDashboardConfiguration } from "./configuration.js";
import type { EgdLogEntry } from "./types.js";

const logs: EgdLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|restricted[_-]?data|payroll|ssn|bank[_-]?account)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive enterprise data omitted]";
  }
  return details;
}

export function appendEgdLog(input: {
  event: string;
  level: EgdLogEntry["level"];
  details: string;
}): EgdLogEntry {
  const entry: EgdLogEntry = {
    logId: `egd-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getEgdLogs(
  limit = 50,
  config?: ExecutiveGlobalDashboardConfiguration,
): EgdLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetEgdLogsForTesting(): void {
  logs.length = 0;
}
