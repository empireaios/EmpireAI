/** X3-06 — Supplier Scale Engine logging. */

import type { SupplierScaleEngineConfiguration } from "./configuration.js";
import type { SseLogEntry } from "./types.js";

const logs: SseLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|supplier[_-]?secret|vendor[_-]?account[_-]?secret)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive supplier or credential data omitted]";
  }
  return details;
}

export function appendSseLog(input: {
  event: string;
  level: SseLogEntry["level"];
  details: string;
}): SseLogEntry {
  const entry: SseLogEntry = {
    logId: `sse-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getSseLogs(
  limit = 50,
  config?: SupplierScaleEngineConfiguration,
): SseLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetSseLogsForTesting(): void {
  logs.length = 0;
}
