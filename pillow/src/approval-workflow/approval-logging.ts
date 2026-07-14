/** T4-07 — Approval Workflow in-memory logging. */

import type { ApprovalLogEntry } from "./types.js";
import type { ApprovalWorkflowConfiguration } from "./configuration.js";

const logs: ApprovalLogEntry[] = [];

export function appendApprovalLog(entry: {
  event: string;
  level: "info" | "warn" | "error";
  details: string;
}): void {
  logs.push({
    logId: `aw-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  });
  if (logs.length > 500) logs.splice(0, logs.length - 500);
}

export function getApprovalLogs(
  limit = 20,
  config?: ApprovalWorkflowConfiguration,
): ApprovalLogEntry[] {
  void config;
  return logs.slice(-limit);
}

export function resetApprovalLogsForTesting(): void {
  logs.length = 0;
}
