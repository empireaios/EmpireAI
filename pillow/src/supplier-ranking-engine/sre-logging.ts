/** R2-08 — Supplier ranking engine logging. */

import type { SupplierRankingEngineConfiguration } from "./configuration.js";
import type { SupplierRankingLogEntry } from "./types.js";

const logs: SupplierRankingLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|consumer_key|consumer_secret|credential|authorization|bearer|client[_-]?id|api[_-]?key)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — supplier credential omitted]";
  }
  return details;
}

export function appendSreLog(input: {
  event: string;
  level: SupplierRankingLogEntry["level"];
  details: string;
}): SupplierRankingLogEntry {
  const entry: SupplierRankingLogEntry = {
    logId: `sre-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getSreLogs(
  limit = 50,
  config?: SupplierRankingEngineConfiguration,
): SupplierRankingLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetSreLogsForTesting(): void {
  logs.length = 0;
}
