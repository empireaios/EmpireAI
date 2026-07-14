/** T1-08 — Visual memory session logging. */

import type { VisualMemoryConfiguration } from "./configuration.js";
import type { MemoryLogEntry } from "./types.js";

const logs: MemoryLogEntry[] = [];

export function appendMemoryLog(input: {
  event: string;
  level: MemoryLogEntry["level"];
  details: string;
}): MemoryLogEntry {
  const entry: MemoryLogEntry = {
    logId: `vme-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getMemoryLogs(
  limit = 50,
  config?: VisualMemoryConfiguration,
): MemoryLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetMemoryLogsForTesting(): void {
  logs.length = 0;
}
