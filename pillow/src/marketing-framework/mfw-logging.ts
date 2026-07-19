/** R5-01 — Marketing Framework logging. */

import type { MarketingFrameworkConfiguration } from "./configuration.js";
import type { FrameworkLogEntry } from "./types.js";

const logs: FrameworkLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|ad[_-]?account|pixel|campaign[_-]?secret)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive marketing value omitted]";
  }
  return details;
}

export function appendFrameworkLog(input: {
  event: string;
  level: FrameworkLogEntry["level"];
  details: string;
}): FrameworkLogEntry {
  const entry: FrameworkLogEntry = {
    logId: `mfw-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getFrameworkLogs(
  limit = 50,
  config?: MarketingFrameworkConfiguration,
): FrameworkLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetFrameworkLogsForTesting(): void {
  logs.length = 0;
}
