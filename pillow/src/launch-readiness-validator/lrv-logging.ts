/** X1-10 — Launch Readiness Validator logging. */

import type { LaunchReadinessValidatorConfiguration } from "./configuration.js";
import type { LaunchLogEntry } from "./types.js";

const logs: LaunchLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive operational credential omitted]";
  }
  return details;
}

export function appendLrvLog(input: {
  event: string;
  level: LaunchLogEntry["level"];
  details: string;
}): LaunchLogEntry {
  const entry: LaunchLogEntry = {
    logId: `lrv-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getLrvLogs(
  limit = 50,
  config?: LaunchReadinessValidatorConfiguration,
): LaunchLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetLrvLogsForTesting(): void {
  logs.length = 0;
}
