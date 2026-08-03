/** X4-01 — Global Expansion Framework logging. */

import type { GlobalExpansionFrameworkConfiguration } from "./configuration.js";
import type { ExpansionFrameworkLogEntry } from "./types.js";

const logs: ExpansionFrameworkLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive operational credential omitted]";
  }
  return details;
}

export function appendGefLog(input: {
  event: string;
  level: ExpansionFrameworkLogEntry["level"];
  details: string;
}): ExpansionFrameworkLogEntry {
  const entry: ExpansionFrameworkLogEntry = {
    logId: `gef-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getGefLogs(
  limit = 50,
  config?: GlobalExpansionFrameworkConfiguration,
): ExpansionFrameworkLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetGefLogsForTesting(): void {
  logs.length = 0;
}
