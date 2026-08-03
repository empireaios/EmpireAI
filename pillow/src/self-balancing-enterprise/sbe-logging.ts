/** X3-19 — Self-Balancing Enterprise logging. */

import type { SelfBalancingEnterpriseConfiguration } from "./configuration.js";
import type { SbeLogEntry } from "./types.js";

const logs: SbeLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|payroll|ssn|salary|wage|bank[_-]?account|customer[_-]?pii|revenue[_-]?amount|gross[_-]?margin|net[_-]?income|net[_-]?profit|operating[_-]?income|iban|routing[_-]?number)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive enterprise or credential data omitted]";
  }
  return details;
}

export function appendSbeLog(input: {
  event: string;
  level: SbeLogEntry["level"];
  details: string;
}): SbeLogEntry {
  const entry: SbeLogEntry = {
    logId: `sbe-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getSbeLogs(
  limit = 50,
  config?: SelfBalancingEnterpriseConfiguration,
): SbeLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetSbeLogsForTesting(): void {
  logs.length = 0;
}
