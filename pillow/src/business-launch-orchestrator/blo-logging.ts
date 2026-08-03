/** X1-11 — Business Launch Orchestrator logging. */

import type { BusinessLaunchOrchestratorConfiguration } from "./configuration.js";
import type { LaunchOrchestratorLogEntry } from "./types.js";

const logs: LaunchOrchestratorLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive operational credential omitted]";
  }
  return details;
}

export function appendBloLog(input: {
  event: string;
  level: LaunchOrchestratorLogEntry["level"];
  details: string;
}): LaunchOrchestratorLogEntry {
  const entry: LaunchOrchestratorLogEntry = {
    logId: `blo-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getBloLogs(
  limit = 50,
  config?: BusinessLaunchOrchestratorConfiguration,
): LaunchOrchestratorLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetBloLogsForTesting(): void {
  logs.length = 0;
}
