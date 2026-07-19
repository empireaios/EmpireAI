/** R3-07 — Cash Flow Monitor logging. */

import type { CashFlowMonitorConfiguration } from "./configuration.js";
import type { CashFlowLogEntry } from "./types.js";

const logs: CashFlowLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|account[_-]?number|iban|routing|ssn|card)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive financial value omitted]";
  }
  return details;
}

export function appendCfLog(input: {
  event: string;
  level: CashFlowLogEntry["level"];
  details: string;
}): CashFlowLogEntry {
  const entry: CashFlowLogEntry = {
    logId: `cf-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getCfLogs(
  limit = 50,
  config?: CashFlowMonitorConfiguration,
): CashFlowLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetCfLogsForTesting(): void {
  logs.length = 0;
}
