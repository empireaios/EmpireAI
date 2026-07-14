/** T3-03 — Layout Refactoring event logging. */

import type { LayoutRefactoringConfiguration } from "./configuration.js";
import type { LayoutRefactoringLogEntry } from "./types.js";

const MAX_LOGS = 200;
const logs: LayoutRefactoringLogEntry[] = [];

export function appendRefactoringLog(input: {
  event: string;
  level: "info" | "warn" | "error";
  details: string;
}): void {
  logs.push({
    logId: `lr-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  });
  if (logs.length > MAX_LOGS) logs.shift();
}

export function getRefactoringLogs(
  limit = 20,
  config?: LayoutRefactoringConfiguration,
): LayoutRefactoringLogEntry[] {
  void config;
  return logs.slice(-limit);
}

export function resetRefactoringLogsForTesting(): void {
  logs.length = 0;
}
