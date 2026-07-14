/** T1-02 — Mapping session logging. */

import type { UiStateMapperConfiguration } from "./configuration.js";
import type { MappingLogEntry } from "./types.js";

const logs: MappingLogEntry[] = [];

export function appendMappingLog(input: {
  event: string;
  level: MappingLogEntry["level"];
  details: string;
}): MappingLogEntry {
  const entry: MappingLogEntry = {
    logId: `usm-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getMappingLogs(limit = 50, config?: UiStateMapperConfiguration): MappingLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetMappingLogsForTesting(): void {
  logs.length = 0;
}
