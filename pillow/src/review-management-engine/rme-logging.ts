/** R4-11 — Review Management Engine logging. */

import type { ReviewManagementEngineConfiguration } from "./configuration.js";
import type { RmeLogEntry } from "./types.js";

const logs: RmeLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|ssn|card)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive customer value omitted]";
  }
  return details;
}

export function appendRmeLog(input: {
  event: string;
  level: RmeLogEntry["level"];
  details: string;
}): RmeLogEntry {
  const entry: RmeLogEntry = {
    logId: `rme-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getRmeLogs(
  limit = 50,
  config?: ReviewManagementEngineConfiguration,
): RmeLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetRmeLogsForTesting(): void {
  logs.length = 0;
}
