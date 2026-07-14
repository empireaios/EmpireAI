/** T1-04 — Layout session logging. */

import type { LayoutUnderstandingConfiguration } from "./configuration.js";
import type { LayoutLogEntry } from "./types.js";

const logs: LayoutLogEntry[] = [];

export function appendLayoutLog(input: {
  event: string;
  level: LayoutLogEntry["level"];
  details: string;
}): LayoutLogEntry {
  const entry: LayoutLogEntry = {
    logId: `lue-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getLayoutLogs(
  limit = 50,
  config?: LayoutUnderstandingConfiguration,
): LayoutLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetLayoutLogsForTesting(): void {
  logs.length = 0;
}
