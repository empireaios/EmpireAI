/** X2-17 — Company Lifecycle Manager logging. */

import type { CompanyLifecycleManagerConfiguration } from "./configuration.js";
import type { LifecycleLogEntry } from "./types.js";

const logs: LifecycleLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|ssn|bank[_-]?account)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive enterprise or credential data omitted]";
  }
  return details;
}

export function appendClmLog(input: {
  event: string;
  level: LifecycleLogEntry["level"];
  details: string;
}): LifecycleLogEntry {
  const entry: LifecycleLogEntry = {
    logId: `clm-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getClmLogs(
  limit = 50,
  config?: CompanyLifecycleManagerConfiguration,
): LifecycleLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetClmLogsForTesting(): void {
  logs.length = 0;
}
