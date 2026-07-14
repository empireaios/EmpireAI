/** T1-06 — Interaction tracking session logging. */

import type { InteractionTrackingConfiguration } from "./configuration.js";
import type { InteractionLogEntry } from "./types.js";

const logs: InteractionLogEntry[] = [];

export function appendInteractionLog(input: {
  event: string;
  level: InteractionLogEntry["level"];
  details: string;
}): InteractionLogEntry {
  const entry: InteractionLogEntry = {
    logId: `ite-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getInteractionLogs(
  limit = 50,
  config?: InteractionTrackingConfiguration,
): InteractionLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetInteractionLogsForTesting(): void {
  logs.length = 0;
}
