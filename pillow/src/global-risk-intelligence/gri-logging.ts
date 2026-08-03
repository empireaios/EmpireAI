/** X4-14 — Global Risk Intelligence logging. */

import type { GlobalRiskIntelligenceConfiguration } from "./configuration.js";
import type { RgoLogEntry } from "./types.js";

const logs: RgoLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|bank[_-]?account|revenue[_-]?detail|margin[_-]?detail)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive operational data omitted]";
  }
  return details;
}

export function appendRgoLog(input: {
  event: string;
  level: RgoLogEntry["level"];
  details: string;
}): RgoLogEntry {
  const entry: RgoLogEntry = {
    logId: `gri-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getRgoLogs(
  limit = 50,
  config?: GlobalRiskIntelligenceConfiguration,
): RgoLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetRgoLogsForTesting(): void {
  logs.length = 0;
}
