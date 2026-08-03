/** X4-05 — Currency Intelligence logging. */

import type { CurrencyIntelligenceConfiguration } from "./configuration.js";
import type { CurLogEntry } from "./types.js";

const logs: CurLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|operational[_-]?secret|account[_-]?number|iban|routing[_-]?number|card[_-]?number)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive operational or financial data omitted]";
  }
  return details;
}

export function appendCurLog(input: {
  event: string;
  level: CurLogEntry["level"];
  details: string;
}): CurLogEntry {
  const entry: CurLogEntry = {
    logId: `cur-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getCurLogs(
  limit = 50,
  config?: CurrencyIntelligenceConfiguration,
): CurLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetCurLogsForTesting(): void {
  logs.length = 0;
}
