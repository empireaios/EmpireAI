/** R2-10 — Fulfilment orchestrator logging. */

import type { FulfilmentOrchestratorConfiguration } from "./configuration.js";
import type { FulfilmentLogEntry } from "./types.js";

const logs: FulfilmentLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|consumer_key|consumer_secret|credential|authorization|bearer|client[_-]?id|api[_-]?key)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — supplier credential omitted]";
  }
  return details;
}

export function appendFoLog(input: {
  event: string;
  level: FulfilmentLogEntry["level"];
  details: string;
}): FulfilmentLogEntry {
  const entry: FulfilmentLogEntry = {
    logId: `fo-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getFoLogs(
  limit = 50,
  config?: FulfilmentOrchestratorConfiguration,
): FulfilmentLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetFoLogsForTesting(): void {
  logs.length = 0;
}
