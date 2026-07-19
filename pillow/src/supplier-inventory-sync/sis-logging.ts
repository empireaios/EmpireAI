/** R2-06 — Supplier inventory sync logging. */

import type { SupplierInventorySyncConfiguration } from "./configuration.js";
import type { SupplierInventorySyncLogEntry } from "./types.js";

const logs: SupplierInventorySyncLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|consumer_key|consumer_secret|credential|authorization|bearer|client[_-]?id|api[_-]?key)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — supplier credential omitted]";
  }
  return details;
}

export function appendSisLog(input: {
  event: string;
  level: SupplierInventorySyncLogEntry["level"];
  details: string;
}): SupplierInventorySyncLogEntry {
  const entry: SupplierInventorySyncLogEntry = {
    logId: `sis-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getSisLogs(
  limit = 50,
  config?: SupplierInventorySyncConfiguration,
): SupplierInventorySyncLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetSisLogsForTesting(): void {
  logs.length = 0;
}
