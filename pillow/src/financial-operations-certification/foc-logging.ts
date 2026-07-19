/** R3-18 — Financial Operations Certification logging. */

import type { FinancialOperationsCertificationConfiguration } from "./configuration.js";
import type { FinancialOperationsCertificationLogEntry } from "./types.js";

const logs: FinancialOperationsCertificationLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|account[_-]?number|iban|routing|ssn|card)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive financial value omitted]";
  }
  return details;
}

export function appendCertificationLog(input: {
  event: string;
  level: FinancialOperationsCertificationLogEntry["level"];
  details: string;
}): FinancialOperationsCertificationLogEntry {
  const entry: FinancialOperationsCertificationLogEntry = {
    logId: `foc-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getCertificationLogs(
  limit = 50,
  config?: FinancialOperationsCertificationConfiguration,
): FinancialOperationsCertificationLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetCertificationLogsForTesting(): void {
  logs.length = 0;
}
