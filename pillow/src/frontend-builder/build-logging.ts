/** T3-01 — Frontend Builder logging. */

import type { FrontendBuilderConfiguration } from "./configuration.js";
import type { FrontendBuildLogEntry } from "./types.js";

const logs: FrontendBuildLogEntry[] = [];

export function appendBuildLog(input: {
  event: string;
  level: FrontendBuildLogEntry["level"];
  details: string;
}): FrontendBuildLogEntry {
  const entry: FrontendBuildLogEntry = {
    logId: `fb-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getBuildLogs(
  limit = 50,
  config?: FrontendBuilderConfiguration,
): FrontendBuildLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetBuildLogsForTesting(): void {
  logs.length = 0;
}
