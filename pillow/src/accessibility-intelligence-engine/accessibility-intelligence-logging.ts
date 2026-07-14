/** T2-06 — Accessibility Intelligence session logging. */

import type { AccessibilityIntelligenceConfiguration } from "./configuration.js";
import type { AccessibilityLogEntry } from "./types.js";

const logs: AccessibilityLogEntry[] = [];

export function appendAccessibilityLog(input: {
  event: string;
  level: AccessibilityLogEntry["level"];
  details: string;
}): AccessibilityLogEntry {
  const entry: AccessibilityLogEntry = {
    logId: `aii-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getAccessibilityLogs(
  limit = 50,
  config?: AccessibilityIntelligenceConfiguration,
): AccessibilityLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetAccessibilityLogsForTesting(): void {
  logs.length = 0;
}
