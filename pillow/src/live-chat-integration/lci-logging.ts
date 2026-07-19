/** R4-07 — Live Chat Integration logging. */

import type { LiveChatIntegrationConfiguration } from "./configuration.js";
import type { LciLogEntry } from "./types.js";

const logs: LciLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|ssn|card)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive customer value omitted]";
  }
  return details;
}

export function appendLciLog(input: {
  event: string;
  level: LciLogEntry["level"];
  details: string;
}): LciLogEntry {
  const entry: LciLogEntry = {
    logId: `lci-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getLciLogs(
  limit = 50,
  config?: LiveChatIntegrationConfiguration,
): LciLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetLciLogsForTesting(): void {
  logs.length = 0;
}
