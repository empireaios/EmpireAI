/** R3-11 — Tax Intelligence Engine logging. */

import type { TaxIntelligenceEngineConfiguration } from "./configuration.js";
import type { TaxLogEntry } from "./types.js";

const logs: TaxLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|account[_-]?number|iban|routing|ssn|card)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive financial value omitted]";
  }
  return details;
}

export function appendTxLog(input: {
  event: string;
  level: TaxLogEntry["level"];
  details: string;
}): TaxLogEntry {
  const entry: TaxLogEntry = {
    logId: `tx-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getTxLogs(
  limit = 50,
  config?: TaxIntelligenceEngineConfiguration,
): TaxLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetTxLogsForTesting(): void {
  logs.length = 0;
}
