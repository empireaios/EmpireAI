/** X3-09 — Executive Scaling Dashboard logging. */

import type { ExecutiveScalingDashboardConfiguration } from "./configuration.js";
import type { EsdLogEntry } from "./types.js";

const logs: EsdLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|restricted[_-]?enterprise|payroll|ssn|salary|wage|bank[_-]?account|enterprise[_-]?secret)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive enterprise or credential data omitted]";
  }
  return details;
}

export function appendEsdLog(input: {
  event: string;
  level: EsdLogEntry["level"];
  details: string;
}): EsdLogEntry {
  const entry: EsdLogEntry = {
    logId: `esd-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getEsdLogs(
  limit = 50,
  config?: ExecutiveScalingDashboardConfiguration,
): EsdLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetEsdLogsForTesting(): void {
  logs.length = 0;
}
