/** R5-09 — Attribution Engine logging. */

import type { AttributionEngineConfiguration } from "./configuration.js";
import type { AttributionLogEntry } from "./types.js";

const logs: AttributionLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|ssn|email@|phone)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive attribution/customer value omitted]";
  }
  return details;
}

export function appendAttLog(input: {
  event: string;
  level: AttributionLogEntry["level"];
  details: string;
}): AttributionLogEntry {
  const entry: AttributionLogEntry = {
    logId: `att-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getAttLogs(
  limit = 50,
  config?: AttributionEngineConfiguration,
): AttributionLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetAttLogsForTesting(): void {
  logs.length = 0;
}
