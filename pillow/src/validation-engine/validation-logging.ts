/** T3-06 — Validation Engine event logging. */

import type { ValidationEngineConfiguration } from "./configuration.js";
import type { ValidationEngineLogEntry } from "./types.js";

const MAX_LOGS = 200;
const logs: ValidationEngineLogEntry[] = [];

export function appendValidationLog(input: {
  event: string;
  level: "info" | "warn" | "error";
  details: string;
}): void {
  logs.push({
    logId: `ve-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  });
  if (logs.length > MAX_LOGS) logs.shift();
}

export function getValidationLogs(
  limit = 20,
  config?: ValidationEngineConfiguration,
): ValidationEngineLogEntry[] {
  void config;
  return logs.slice(-limit);
}

export function resetValidationLogsForTesting(): void {
  logs.length = 0;
}
