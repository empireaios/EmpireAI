/** T2-09 — Recommendation Engine logging. */

import type { RecommendationLogEntry } from "./types.js";
import type { RecommendationEngineConfiguration } from "./configuration.js";

const LOG_BUFFER: RecommendationLogEntry[] = [];
const MAX_LOGS = 200;

export function appendRecommendationLog(entry: {
  event: string;
  level: "info" | "warn" | "error";
  details: string;
}): void {
  LOG_BUFFER.push({
    logId: `rec-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  });
  if (LOG_BUFFER.length > MAX_LOGS) {
    LOG_BUFFER.splice(0, LOG_BUFFER.length - MAX_LOGS);
  }
}

export function getRecommendationLogs(
  limit = 20,
  config?: RecommendationEngineConfiguration,
): RecommendationLogEntry[] {
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

export function resetRecommendationLogsForTesting(): void {
  LOG_BUFFER.length = 0;
}
