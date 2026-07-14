/** T2-07 — Visual Consistency logging. */

import type { ConsistencyLogEntry } from "./types.js";
import type { VisualConsistencyConfiguration } from "./configuration.js";

const LOG_BUFFER: ConsistencyLogEntry[] = [];
const MAX_LOGS = 200;

export function appendConsistencyLog(entry: {
  event: string;
  level: "info" | "warn" | "error";
  details: string;
}): void {
  LOG_BUFFER.push({
    logId: `vce-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  });
  if (LOG_BUFFER.length > MAX_LOGS) {
    LOG_BUFFER.splice(0, LOG_BUFFER.length - MAX_LOGS);
  }
}

export function getConsistencyLogs(
  limit = 20,
  config?: VisualConsistencyConfiguration,
): ConsistencyLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levels = level === "debug" ? ["info", "warn", "error"] : level === "info" ? ["info", "warn", "error"] : level === "warn" ? ["warn", "error"] : ["error"];
  return LOG_BUFFER.filter((l) => levels.includes(l.level)).slice(-limit);
}

export function resetConsistencyLogsForTesting(): void {
  LOG_BUFFER.length = 0;
}
