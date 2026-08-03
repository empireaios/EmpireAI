/** X3-18 — Scale Simulation Engine logging. */

import type { ScaleSimulationEngineConfiguration } from "./configuration.js";
import type { SsiLogEntry } from "./types.js";

const logs: SsiLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|payroll|ssn|salary|wage|bank[_-]?account|customer[_-]?pii|revenue[_-]?amount|gross[_-]?margin|net[_-]?income|net[_-]?profit|operating[_-]?income|iban|routing[_-]?number)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive enterprise or credential data omitted]";
  }
  return details;
}

export function appendSsiLog(input: {
  event: string;
  level: SsiLogEntry["level"];
  details: string;
}): SsiLogEntry {
  const entry: SsiLogEntry = {
    logId: `ssi-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getSsiLogs(
  limit = 50,
  config?: ScaleSimulationEngineConfiguration,
): SsiLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetSsiLogsForTesting(): void {
  logs.length = 0;
}
