/** X4-09 — Global Market Intelligence logging. */

import type { GlobalMarketIntelligenceConfiguration } from "./configuration.js";
import type { GmiLogEntry } from "./types.js";

const logs: GmiLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|operational[_-]?secret|customer[_-]?list|pricing[_-]?sheet)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive operational data omitted]";
  }
  return details;
}

export function appendGmiLog(input: {
  event: string;
  level: GmiLogEntry["level"];
  details: string;
}): GmiLogEntry {
  const entry: GmiLogEntry = {
    logId: `gmi-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getGmiLogs(
  limit = 50,
  config?: GlobalMarketIntelligenceConfiguration,
): GmiLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetGmiLogsForTesting(): void {
  logs.length = 0;
}
