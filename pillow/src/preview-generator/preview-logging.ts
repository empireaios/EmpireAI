/** T3-05 — Preview Generator event logging. */

import type { PreviewGeneratorConfiguration } from "./configuration.js";
import type { PreviewGeneratorLogEntry } from "./types.js";

const MAX_LOGS = 200;
const logs: PreviewGeneratorLogEntry[] = [];

export function appendPreviewLog(input: {
  event: string;
  level: "info" | "warn" | "error";
  details: string;
}): void {
  logs.push({
    logId: `pg-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  });
  if (logs.length > MAX_LOGS) logs.shift();
}

export function getPreviewLogs(
  limit = 20,
  config?: PreviewGeneratorConfiguration,
): PreviewGeneratorLogEntry[] {
  void config;
  return logs.slice(-limit);
}

export function resetPreviewLogsForTesting(): void {
  logs.length = 0;
}
