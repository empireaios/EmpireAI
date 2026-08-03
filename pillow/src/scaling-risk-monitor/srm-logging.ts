/** X3-13 — Scaling Risk Monitor logging. */

import type { ScalingRiskMonitorConfiguration } from "./configuration.js";
import type { SrmLogEntry } from "./types.js";

const logs: SrmLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|payroll|ssn|salary|wage|operational[_-]?secret|bank[_-]?account|customer[_-]?pii)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive operational or credential data omitted]";
  }
  return details;
}

export function appendSrmLog(input: {
  event: string;
  level: SrmLogEntry["level"];
  details: string;
}): SrmLogEntry {
  const entry: SrmLogEntry = {
    logId: `srm-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getSrmLogs(
  limit = 50,
  config?: ScalingRiskMonitorConfiguration,
): SrmLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetSrmLogsForTesting(): void {
  logs.length = 0;
}
