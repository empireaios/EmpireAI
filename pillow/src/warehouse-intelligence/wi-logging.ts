/** R2-14 — Warehouse intelligence logging. */

import type { WarehouseIntelligenceConfiguration } from "./configuration.js";
import type { WarehouseLogEntry } from "./types.js";

const logs: WarehouseLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|consumer_key|consumer_secret|credential|authorization|bearer|client[_-]?id|api[_-]?key)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — warehouse credential omitted]";
  }
  return details;
}

export function appendWiLog(input: {
  event: string;
  level: WarehouseLogEntry["level"];
  details: string;
}): WarehouseLogEntry {
  const entry: WarehouseLogEntry = {
    logId: `wi-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getWiLogs(
  limit = 50,
  config?: WarehouseIntelligenceConfiguration,
): WarehouseLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetWiLogsForTesting(): void {
  logs.length = 0;
}
