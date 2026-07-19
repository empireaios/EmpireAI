/** R2-16 — Supplier risk monitor logging. */

import type { SupplierRiskMonitorConfiguration } from "./configuration.js";
import type { SupplierRiskLogEntry } from "./types.js";

const logs: SupplierRiskLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|consumer_key|consumer_secret|credential|authorization|bearer|client[_-]?id|api[_-]?key)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — supplier credential omitted]";
  }
  return details;
}

export function appendSrmLog(input: {
  event: string;
  level: SupplierRiskLogEntry["level"];
  details: string;
}): SupplierRiskLogEntry {
  const entry: SupplierRiskLogEntry = {
    logId: `srm-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getSrmLogs(
  limit = 50,
  config?: SupplierRiskMonitorConfiguration,
): SupplierRiskLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetSrmLogsForTesting(): void {
  logs.length = 0;
}
