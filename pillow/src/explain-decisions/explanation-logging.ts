/** T4-06 — Explain Decisions in-memory logging. */

import type { ExplanationLogEntry } from "./types.js";
import type { ExplainDecisionsConfiguration } from "./configuration.js";

const logs: ExplanationLogEntry[] = [];

export function appendExplanationLog(entry: {
  event: string;
  level: "info" | "warn" | "error";
  details: string;
}): void {
  logs.push({
    logId: `ed-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  });
  if (logs.length > 500) logs.splice(0, logs.length - 500);
}

export function getExplanationLogs(
  limit = 20,
  config?: ExplainDecisionsConfiguration,
): ExplanationLogEntry[] {
  void config;
  return logs.slice(-limit);
}

export function resetExplanationLogsForTesting(): void {
  logs.length = 0;
}
