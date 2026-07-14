/** T2-04 — Layout Evaluation session logging. */

import type { LayoutEvaluationConfiguration } from "./configuration.js";
import type { EvaluationLogEntry } from "./types.js";

const logs: EvaluationLogEntry[] = [];

export function appendLayoutEvaluationLog(input: {
  event: string;
  level: EvaluationLogEntry["level"];
  details: string;
}): EvaluationLogEntry {
  const entry: EvaluationLogEntry = {
    logId: `lev-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getLayoutEvaluationLogs(
  limit = 50,
  config?: LayoutEvaluationConfiguration,
): EvaluationLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetLayoutEvaluationLogsForTesting(): void {
  logs.length = 0;
}
