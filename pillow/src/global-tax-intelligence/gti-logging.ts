/** X4-07 — Global Tax Intelligence logging. */

import type { GlobalTaxIntelligenceConfiguration } from "./configuration.js";
import type { GtiLogEntry } from "./types.js";

const logs: GtiLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|operational[_-]?secret|ssn|passport|tax[_-]?id|bank[_-]?account|iban|routing[_-]?number|amount[_-]?paid|salary|wage)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive operational or financial data omitted]";
  }
  return details;
}

export function appendGtiLog(input: {
  event: string;
  level: GtiLogEntry["level"];
  details: string;
}): GtiLogEntry {
  const entry: GtiLogEntry = {
    logId: `gti-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getGtiLogs(
  limit = 50,
  config?: GlobalTaxIntelligenceConfiguration,
): GtiLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetGtiLogsForTesting(): void {
  logs.length = 0;
}
