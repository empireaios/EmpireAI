/** R2-18 — Fulfilment SLA monitor logging. */

import type { FulfilmentSlaMonitorConfiguration } from "./configuration.js";
import type { SlaLogEntry } from "./types.js";

const logs: SlaLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|consumer_key|consumer_secret|credential|authorization|bearer|client[_-]?id|api[_-]?key|tracking_number)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — fulfilment credential omitted]";
  }
  return details;
}

export function appendFsmLog(input: {
  event: string;
  level: SlaLogEntry["level"];
  details: string;
}): SlaLogEntry {
  const entry: SlaLogEntry = {
    logId: `fsm-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getFsmLogs(
  limit = 50,
  config?: FulfilmentSlaMonitorConfiguration,
): SlaLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetFsmLogsForTesting(): void {
  logs.length = 0;
}
