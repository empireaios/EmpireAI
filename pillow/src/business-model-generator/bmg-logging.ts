/** X1-04 — Business Model Generator logging. */

import type { BusinessModelGeneratorConfiguration } from "./configuration.js";
import type { BusinessModelLogEntry } from "./types.js";

const logs: BusinessModelLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive operational credential omitted]";
  }
  return details;
}

export function appendBmgLog(input: {
  event: string;
  level: BusinessModelLogEntry["level"];
  details: string;
}): BusinessModelLogEntry {
  const entry: BusinessModelLogEntry = {
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
  config?: BusinessModelGeneratorConfiguration,
): BusinessModelLogEntry[] {
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
