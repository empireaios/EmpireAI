/** T3-09 — Change Documentation event logging. */

import type { ChangeDocumentationConfiguration } from "./configuration.js";
import type { ChangeDocumentationLogEntry } from "./types.js";

const MAX_LOGS = 200;
const logs: ChangeDocumentationLogEntry[] = [];

export function appendChangeDocumentationLog(input: {
  event: string;
  level: "info" | "warn" | "error";
  details: string;
}): void {
  logs.push({
    logId: `cd-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  });
  if (logs.length > MAX_LOGS) logs.shift();
}

export function getChangeDocumentationLogs(
  limit = 20,
  config?: ChangeDocumentationConfiguration,
): ChangeDocumentationLogEntry[] {
  void config;
  return logs.slice(-limit);
}

export function resetChangeDocumentationLogsForTesting(): void {
  logs.length = 0;
}
