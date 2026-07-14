/** T3-08 — Rollback Manager event logging. */

import type { RollbackManagerConfiguration } from "./configuration.js";
import type { RollbackManagerLogEntry } from "./types.js";

const MAX_LOGS = 200;
const logs: RollbackManagerLogEntry[] = [];

export function appendRollbackLog(input: {
  event: string;
  level: "info" | "warn" | "error";
  details: string;
}): void {
  logs.push({
    logId: `rm-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  });
  if (logs.length > MAX_LOGS) logs.shift();
}

export function getRollbackLogs(
  limit = 20,
  config?: RollbackManagerConfiguration,
): RollbackManagerLogEntry[] {
  void config;
  return logs.slice(-limit);
}

export function resetRollbackLogsForTesting(): void {
  logs.length = 0;
}
