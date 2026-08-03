/** X2-06 — Executive Portfolio Dashboard logging. */

import type { ExecutivePortfolioDashboardConfiguration } from "./configuration.js";
import type { DashboardLogEntry } from "./types.js";

const logs: DashboardLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive enterprise credential omitted]";
  }
  return details;
}

export function appendEpdLog(input: {
  event: string;
  level: DashboardLogEntry["level"];
  details: string;
}): DashboardLogEntry {
  const entry: DashboardLogEntry = {
    logId: `epd-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getEpdLogs(
  limit = 50,
  config?: ExecutivePortfolioDashboardConfiguration,
): DashboardLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetEpdLogsForTesting(): void {
  logs.length = 0;
}
