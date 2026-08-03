/** X2-05 — Capital Distribution Engine logging. */

import type { CapitalDistributionEngineConfiguration } from "./configuration.js";
import type { CapitalLogEntry } from "./types.js";

const logs: CapitalLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|bank[_-]?account|routing[_-]?number|iban|swift|ssn)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive financial credential omitted]";
  }
  return details;
}

export function appendCdeLog(input: {
  event: string;
  level: CapitalLogEntry["level"];
  details: string;
}): CapitalLogEntry {
  const entry: CapitalLogEntry = {
    logId: `cde-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getCdeLogs(
  limit = 50,
  config?: CapitalDistributionEngineConfiguration,
): CapitalLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetCdeLogsForTesting(): void {
  logs.length = 0;
}
