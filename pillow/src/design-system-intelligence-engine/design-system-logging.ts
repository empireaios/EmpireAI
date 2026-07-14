/** T2-02 — Design System Intelligence session logging. */

import type { DesignSystemIntelligenceConfiguration } from "./configuration.js";
import type { IntelligenceLogEntry } from "./types.js";

const logs: IntelligenceLogEntry[] = [];

export function appendDesignSystemLog(input: {
  event: string;
  level: IntelligenceLogEntry["level"];
  details: string;
}): IntelligenceLogEntry {
  const entry: IntelligenceLogEntry = {
    logId: `dsi-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getDesignSystemLogs(
  limit = 50,
  config?: DesignSystemIntelligenceConfiguration,
): IntelligenceLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetDesignSystemLogsForTesting(): void {
  logs.length = 0;
}
