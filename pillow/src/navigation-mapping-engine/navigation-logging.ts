/** T1-05 — Navigation mapping session logging. */

import type { NavigationMappingConfiguration } from "./configuration.js";
import type { NavigationLogEntry } from "./types.js";

const logs: NavigationLogEntry[] = [];

export function appendNavigationLog(input: {
  event: string;
  level: NavigationLogEntry["level"];
  details: string;
}): NavigationLogEntry {
  const entry: NavigationLogEntry = {
    logId: `nme-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getNavigationLogs(
  limit = 50,
  config?: NavigationMappingConfiguration,
): NavigationLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetNavigationLogsForTesting(): void {
  logs.length = 0;
}
