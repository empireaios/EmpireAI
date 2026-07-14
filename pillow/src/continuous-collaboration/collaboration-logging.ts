/** T4-09 — Continuous Collaboration in-memory logging. */

import type { CollaborationLogEntry } from "./types.js";
import type { ContinuousCollaborationConfiguration } from "./configuration.js";

const logs: CollaborationLogEntry[] = [];

export function appendCollaborationLog(entry: {
  event: string;
  level: "info" | "warn" | "error";
  details: string;
}): void {
  logs.push({
    logId: `cc-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  });
  if (logs.length > 500) logs.splice(0, logs.length - 500);
}

export function getCollaborationLogs(
  limit = 20,
  config?: ContinuousCollaborationConfiguration,
): CollaborationLogEntry[] {
  void config;
  return logs.slice(-limit);
}

export function resetCollaborationLogsForTesting(): void {
  logs.length = 0;
}
