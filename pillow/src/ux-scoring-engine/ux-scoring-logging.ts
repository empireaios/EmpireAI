/** T2-08 — UX Scoring logging. */

import type { UxScoringLogEntry } from "./types.js";
import type { UxScoringConfiguration } from "./configuration.js";

const LOG_BUFFER: UxScoringLogEntry[] = [];
const MAX_LOGS = 200;

export function appendScoringLog(entry: {
  event: string;
  level: "info" | "warn" | "error";
  details: string;
}): void {
  LOG_BUFFER.push({
    logId: `uxs-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  });
  if (LOG_BUFFER.length > MAX_LOGS) {
    LOG_BUFFER.splice(0, LOG_BUFFER.length - MAX_LOGS);
  }
}

export function getScoringLogs(
  limit = 20,
  config?: UxScoringConfiguration,
): UxScoringLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levels =
    level === "debug"
      ? ["info", "warn", "error"]
      : level === "info"
        ? ["info", "warn", "error"]
        : level === "warn"
          ? ["warn", "error"]
          : ["error"];
  return LOG_BUFFER.filter((l) => levels.includes(l.level)).slice(-limit);
}

export function resetScoringLogsForTesting(): void {
  LOG_BUFFER.length = 0;
}
