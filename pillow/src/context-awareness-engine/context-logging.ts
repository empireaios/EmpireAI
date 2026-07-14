/** T1-07 — Context awareness session logging. */

import type { ContextAwarenessConfiguration } from "./configuration.js";
import type { ContextLogEntry } from "./types.js";

const logs: ContextLogEntry[] = [];

export function appendContextLog(input: {
  event: string;
  level: ContextLogEntry["level"];
  details: string;
}): ContextLogEntry {
  const entry: ContextLogEntry = {
    logId: `cae-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getContextLogs(
  limit = 50,
  config?: ContextAwarenessConfiguration,
): ContextLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetContextLogsForTesting(): void {
  logs.length = 0;
}
