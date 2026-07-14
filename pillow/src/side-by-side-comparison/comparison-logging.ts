/** T4-05 — Side-by-Side Comparison event logging (no sensitive raw values). */

import type { SideBySideComparisonConfiguration } from "./configuration.js";
import type { ComparisonLogEntry } from "./types.js";

const MAX_LOGS = 200;
const logs: ComparisonLogEntry[] = [];

export function appendComparisonLog(input: {
  event: string;
  level: "info" | "warn" | "error";
  details: string;
}): void {
  logs.push({
    logId: `sbc-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  });
  if (logs.length > MAX_LOGS) logs.shift();
}

export function getComparisonLogs(
  limit = 20,
  config?: SideBySideComparisonConfiguration,
): ComparisonLogEntry[] {
  void config;
  return logs.slice(-limit);
}

export function resetComparisonLogsForTesting(): void {
  logs.length = 0;
}
