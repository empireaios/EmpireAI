/** X2-19 — Enterprise Value Engine logging. */

import type { EnterpriseValueEngineConfiguration } from "./configuration.js";
import type { ValuationLogEntry } from "./types.js";

const logs: ValuationLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|ssn|bank[_-]?account|account[_-]?number|routing[_-]?number|credit[_-]?card|financial[_-]?secret|salary|revenue[_-]?detail|profit[_-]?margin|balance[_-]?sheet)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive financial or credential data omitted]";
  }
  return details;
}

export function appendEveLog(input: {
  event: string;
  level: ValuationLogEntry["level"];
  details: string;
}): ValuationLogEntry {
  const entry: ValuationLogEntry = {
    logId: `eve-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getEveLogs(
  limit = 50,
  config?: EnterpriseValueEngineConfiguration,
): ValuationLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetEveLogsForTesting(): void {
  logs.length = 0;
}
