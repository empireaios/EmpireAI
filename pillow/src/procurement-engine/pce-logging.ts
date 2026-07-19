/** R2-09 — Procurement engine logging. */

import type { ProcurementEngineConfiguration } from "./configuration.js";
import type { ProcurementLogEntry } from "./types.js";

const logs: ProcurementLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|consumer_key|consumer_secret|credential|authorization|bearer|client[_-]?id|api[_-]?key)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — supplier credential omitted]";
  }
  return details;
}

export function appendPceLog(input: {
  event: string;
  level: ProcurementLogEntry["level"];
  details: string;
}): ProcurementLogEntry {
  const entry: ProcurementLogEntry = {
    logId: `pce-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getPceLogs(
  limit = 50,
  config?: ProcurementEngineConfiguration,
): ProcurementLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetPceLogsForTesting(): void {
  logs.length = 0;
}
