/** R4-09 — Ticket Management Engine logging. */

import type { TicketManagementEngineConfiguration } from "./configuration.js";
import type { TmeLogEntry } from "./types.js";

const logs: TmeLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|ssn|card)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive customer value omitted]";
  }
  return details;
}

export function appendTmeLog(input: {
  event: string;
  level: TmeLogEntry["level"];
  details: string;
}): TmeLogEntry {
  const entry: TmeLogEntry = {
    logId: `tme-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getTmeLogs(
  limit = 50,
  config?: TicketManagementEngineConfiguration,
): TmeLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetTmeLogsForTesting(): void {
  logs.length = 0;
}
