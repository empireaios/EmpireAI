/** R3-03 — Banking Integration logging. */

import type { BankingIntegrationConfiguration } from "./configuration.js";
import type { BankingLogEntry } from "./types.js";

const logs: BankingLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|account[_-]?number|iban|routing|ssn)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive banking value omitted]";
  }
  return details;
}

export function appendBiLog(input: {
  event: string;
  level: BankingLogEntry["level"];
  details: string;
}): BankingLogEntry {
  const entry: BankingLogEntry = {
    logId: `bi-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getBiLogs(
  limit = 50,
  config?: BankingIntegrationConfiguration,
): BankingLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetBiLogsForTesting(): void {
  logs.length = 0;
}
