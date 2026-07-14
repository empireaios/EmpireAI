/** T5-01 — Continuous Screen Observation logging (no sensitive raw values). */

import { randomUUID } from "node:crypto";
import type { ContinuousScreenObservationConfiguration } from "./configuration.js";
import type { ObservationLogEntry } from "./types.js";

const logs: ObservationLogEntry[] = [];

export function appendObservationLog(input: {
  event: string;
  level: ObservationLogEntry["level"];
  details: string;
}): void {
  logs.push({
    logId: randomUUID(),
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitizeDetails(input.details),
  });
  if (logs.length > 500) logs.splice(0, logs.length - 500);
}

function sanitizeDetails(details: string): string {
  return details
    .replace(/Bearer\s+\S+/gi, "[redacted-token]")
    .replace(/password[=:]\S+/gi, "password=[redacted]")
    .replace(/token[=:]\S+/gi, "token=[redacted]")
    .slice(0, 500);
}

export function getObservationLogs(
  limit = 20,
  config?: ContinuousScreenObservationConfiguration,
): ObservationLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const rank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = rank[level];
  return logs
    .filter((entry) => rank[entry.level] >= minRank)
    .slice(-limit);
}

export function resetObservationLogsForTesting(): void {
  logs.length = 0;
}
