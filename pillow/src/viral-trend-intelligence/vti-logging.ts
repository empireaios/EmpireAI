/** R5-16 — Viral Trend Intelligence logging. */

import type { ViralTrendIntelligenceConfiguration } from "./configuration.js";
import type { TrendLogEntry } from "./types.js";

const logs: TrendLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive advertising credential omitted]";
  }
  return details;
}

export function appendVtiLog(input: {
  event: string;
  level: TrendLogEntry["level"];
  details: string;
}): TrendLogEntry {
  const entry: TrendLogEntry = {
    logId: `vti-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getVtiLogs(
  limit = 50,
  config?: ViralTrendIntelligenceConfiguration,
): TrendLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetVtiLogsForTesting(): void {
  logs.length = 0;
}
