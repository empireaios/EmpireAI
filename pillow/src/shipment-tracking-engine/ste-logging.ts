/** R2-12 — Shipment tracking engine logging. */

import type { ShipmentTrackingEngineConfiguration } from "./configuration.js";
import type { TrackingLogEntry } from "./types.js";

const logs: TrackingLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|consumer_key|consumer_secret|credential|authorization|bearer|client[_-]?id|api[_-]?key)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — carrier credential omitted]";
  }
  return details;
}

export function appendSteLog(input: {
  event: string;
  level: TrackingLogEntry["level"];
  details: string;
}): TrackingLogEntry {
  const entry: TrackingLogEntry = {
    logId: `ste-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getSteLogs(
  limit = 50,
  config?: ShipmentTrackingEngineConfiguration,
): TrackingLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetSteLogsForTesting(): void {
  logs.length = 0;
}
