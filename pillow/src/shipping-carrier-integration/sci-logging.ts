/** R2-11 — Shipping carrier integration logging. */

import type { ShippingCarrierIntegrationConfiguration } from "./configuration.js";
import type { CarrierLogEntry } from "./types.js";

const logs: CarrierLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|consumer_key|consumer_secret|credential|authorization|bearer|client[_-]?id|api[_-]?key)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — carrier credential omitted]";
  }
  return details;
}

export function appendSciLog(input: {
  event: string;
  level: CarrierLogEntry["level"];
  details: string;
}): CarrierLogEntry {
  const entry: CarrierLogEntry = {
    logId: `sci-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getSciLogs(
  limit = 50,
  config?: ShippingCarrierIntegrationConfiguration,
): CarrierLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetSciLogsForTesting(): void {
  logs.length = 0;
}
