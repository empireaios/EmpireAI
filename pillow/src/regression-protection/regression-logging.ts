/** T3-07 — Regression Protection event logging. */

import type { RegressionProtectionConfiguration } from "./configuration.js";
import type { RegressionProtectionLogEntry } from "./types.js";

const MAX_LOGS = 200;
const logs: RegressionProtectionLogEntry[] = [];

export function appendRegressionLog(input: {
  event: string;
  level: "info" | "warn" | "error";
  details: string;
}): void {
  logs.push({
    logId: `rp-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  });
  if (logs.length > MAX_LOGS) logs.shift();
}

export function getRegressionLogs(
  limit = 20,
  config?: RegressionProtectionConfiguration,
): RegressionProtectionLogEntry[] {
  void config;
  return logs.slice(-limit);
}

export function resetRegressionLogsForTesting(): void {
  logs.length = 0;
}
