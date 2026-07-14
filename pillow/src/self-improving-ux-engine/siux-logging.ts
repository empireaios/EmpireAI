/** T5-09 — Self-Improving UX logging. */

import { randomUUID } from "node:crypto";
import type { SelfImprovingUxConfiguration } from "./configuration.js";
import type { LearningLogEntry } from "./types.js";

const logs: LearningLogEntry[] = [];

export function appendLearningLog(input: {
  event: string;
  level: LearningLogEntry["level"];
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

export function getLearningLogs(
  limit = 20,
  config?: SelfImprovingUxConfiguration,
): LearningLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const rank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = rank[level];
  return logs.filter((entry) => rank[entry.level] >= minRank).slice(-limit);
}

export function resetLearningLogsForTesting(): void {
  logs.length = 0;
}
