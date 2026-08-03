/** X3-08 — Workforce Intelligence logging. */

import type { WorkforceIntelligenceConfiguration } from "./configuration.js";
import type { WfiLogEntry } from "./types.js";

const logs: WfiLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|payroll|ssn|employee[_-]?id|salary|wage|operational[_-]?secret|agent[_-]?credential)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive operational or credential data omitted]";
  }
  return details;
}

export function appendWfiLog(input: {
  event: string;
  level: WfiLogEntry["level"];
  details: string;
}): WfiLogEntry {
  const entry: WfiLogEntry = {
    logId: `wfi-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getWfiLogs(
  limit = 50,
  config?: WorkforceIntelligenceConfiguration,
): WfiLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetWfiLogsForTesting(): void {
  logs.length = 0;
}
