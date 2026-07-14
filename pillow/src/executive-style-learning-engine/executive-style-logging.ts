/** T2-03 — Executive Style Learning session logging. */

import type { ExecutiveStyleLearningConfiguration } from "./configuration.js";
import type { LearningLogEntry } from "./types.js";

const logs: LearningLogEntry[] = [];

export function appendExecutiveStyleLog(input: {
  event: string;
  level: LearningLogEntry["level"];
  details: string;
}): LearningLogEntry {
  const entry: LearningLogEntry = {
    logId: `esl-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getExecutiveStyleLogs(
  limit = 50,
  config?: ExecutiveStyleLearningConfiguration,
): LearningLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetExecutiveStyleLogsForTesting(): void {
  logs.length = 0;
}
