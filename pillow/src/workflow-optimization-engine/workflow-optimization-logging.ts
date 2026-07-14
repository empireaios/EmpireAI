/** T2-05 — Workflow Optimization session logging. */

import type { WorkflowOptimizationConfiguration } from "./configuration.js";
import type { OptimizationLogEntry } from "./types.js";

const logs: OptimizationLogEntry[] = [];

export function appendWorkflowOptimizationLog(input: {
  event: string;
  level: OptimizationLogEntry["level"];
  details: string;
}): OptimizationLogEntry {
  const entry: OptimizationLogEntry = {
    logId: `wfo-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getWorkflowOptimizationLogs(
  limit = 50,
  config?: WorkflowOptimizationConfiguration,
): OptimizationLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetWorkflowOptimizationLogsForTesting(): void {
  logs.length = 0;
}
