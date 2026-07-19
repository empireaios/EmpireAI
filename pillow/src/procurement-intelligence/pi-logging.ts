/** R2-19 — Procurement intelligence logging. */

import type { ProcurementIntelligenceConfiguration } from "./configuration.js";
import type { ProcurementIntelligenceLogEntry } from "./types.js";

const logs: ProcurementIntelligenceLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|consumer_key|consumer_secret|credential|authorization|bearer|client[_-]?id|api[_-]?key)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — procurement credential omitted]";
  }
  return details;
}

export function appendPiLog(input: {
  event: string;
  level: ProcurementIntelligenceLogEntry["level"];
  details: string;
}): ProcurementIntelligenceLogEntry {
  const entry: ProcurementIntelligenceLogEntry = {
    logId: `pi-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getPiLogs(
  limit = 50,
  config?: ProcurementIntelligenceConfiguration,
): ProcurementIntelligenceLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetPiLogsForTesting(): void {
  logs.length = 0;
}
