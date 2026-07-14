/** T1-09 — Session continuity session logging. */

import type { SessionContinuityConfiguration } from "./configuration.js";
import type { ContinuityLogEntry } from "./types.js";

const logs: ContinuityLogEntry[] = [];

export function appendContinuityLog(input: {
  event: string;
  level: ContinuityLogEntry["level"];
  details: string;
}): ContinuityLogEntry {
  const entry: ContinuityLogEntry = {
    logId: `sce-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getContinuityLogs(
  limit = 50,
  config?: SessionContinuityConfiguration,
): ContinuityLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetContinuityLogsForTesting(): void {
  logs.length = 0;
}
