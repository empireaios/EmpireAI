/** R3-02 — Payment Gateway Integration logging. */

import type { PaymentGatewayIntegrationConfiguration } from "./configuration.js";
import type { PaymentLogEntry } from "./types.js";

const logs: PaymentLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|card|cvv|pan|account)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive payment value omitted]";
  }
  return details;
}

export function appendPgLog(input: {
  event: string;
  level: PaymentLogEntry["level"];
  details: string;
}): PaymentLogEntry {
  const entry: PaymentLogEntry = {
    logId: `pg-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getPgLogs(
  limit = 50,
  config?: PaymentGatewayIntegrationConfiguration,
): PaymentLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetPgLogsForTesting(): void {
  logs.length = 0;
}
