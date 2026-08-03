/** X3-07 — Financial Scale Engine logging. */

import type { FinancialScaleEngineConfiguration } from "./configuration.js";
import type { FseLogEntry } from "./types.js";

const logs: FseLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|bank[_-]?account|iban|routing[_-]?number|tax[_-]?id|ssn|financial[_-]?secret|account[_-]?number)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive financial or credential data omitted]";
  }
  return details;
}

export function appendFseLog(input: {
  event: string;
  level: FseLogEntry["level"];
  details: string;
}): FseLogEntry {
  const entry: FseLogEntry = {
    logId: `fse-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getFseLogs(
  limit = 50,
  config?: FinancialScaleEngineConfiguration,
): FseLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetFseLogsForTesting(): void {
  logs.length = 0;
}
