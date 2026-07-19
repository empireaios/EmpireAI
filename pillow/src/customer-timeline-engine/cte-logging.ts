/** R4-03 — Customer Timeline Engine logging. */

import type { CustomerTimelineEngineConfiguration } from "./configuration.js";
import type { CteLogEntry } from "./types.js";

const logs: CteLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|ssn|card)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive customer value omitted]";
  }
  return details;
}

export function appendCteLog(input: {
  event: string;
  level: CteLogEntry["level"];
  details: string;
}): CteLogEntry {
  const entry: CteLogEntry = {
    logId: `cte-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getCteLogs(
  limit = 50,
  config?: CustomerTimelineEngineConfiguration,
): CteLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetCteLogsForTesting(): void {
  logs.length = 0;
}
