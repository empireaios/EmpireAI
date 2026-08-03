/** X2-12 — Shared Customer Intelligence logging. */

import type { SharedCustomerIntelligenceConfiguration } from "./configuration.js";
import type { CustomerIntelligenceLogEntry } from "./types.js";

const logs: CustomerIntelligenceLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|ssn|email|phone|address|dob|credit[_-]?card)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive customer or credential data omitted]";
  }
  return details;
}

export function appendSciLog(input: {
  event: string;
  level: CustomerIntelligenceLogEntry["level"];
  details: string;
}): CustomerIntelligenceLogEntry {
  const entry: CustomerIntelligenceLogEntry = {
    logId: `sci-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getSciLogs(
  limit = 50,
  config?: SharedCustomerIntelligenceConfiguration,
): CustomerIntelligenceLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetSciLogsForTesting(): void {
  logs.length = 0;
}
