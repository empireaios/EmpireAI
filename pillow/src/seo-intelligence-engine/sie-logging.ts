/** R5-06 — SEO Intelligence Engine logging. */

import type { SeoIntelligenceConfiguration } from "./configuration.js";
import type { SeoLogEntry } from "./types.js";

const logs: SeoLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive SEO value omitted]";
  }
  return details;
}

export function appendSieLog(input: {
  event: string;
  level: SeoLogEntry["level"];
  details: string;
}): SeoLogEntry {
  const entry: SeoLogEntry = {
    logId: `sie-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getSieLogs(
  limit = 50,
  config?: SeoIntelligenceConfiguration,
): SeoLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetSieLogsForTesting(): void {
  logs.length = 0;
}
