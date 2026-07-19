/** R4-15 — Customer Lifetime Value Engine logging. */

import type { CustomerLifetimeValueEngineConfiguration } from "./configuration.js";
import type { ClveLogEntry } from "./types.js";

const logs: ClveLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|ssn|card)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive customer value omitted]";
  }
  return details;
}

export function appendClveLog(input: {
  event: string;
  level: ClveLogEntry["level"];
  details: string;
}): ClveLogEntry {
  const entry: ClveLogEntry = {
    logId: `clve-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getClveLogs(
  limit = 50,
  config?: CustomerLifetimeValueEngineConfiguration,
): ClveLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetClveLogsForTesting(): void {
  logs.length = 0;
}
