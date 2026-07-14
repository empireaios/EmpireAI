/** T4-03 — Screen Annotation event logging (no sensitive screen content). */

import type { ScreenAnnotationConfiguration } from "./configuration.js";
import type { AnnotationLogEntry } from "./types.js";

const MAX_LOGS = 200;
const logs: AnnotationLogEntry[] = [];

export function appendAnnotationLog(input: {
  event: string;
  level: "info" | "warn" | "error";
  details: string;
}): void {
  logs.push({
    logId: `sa-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  });
  if (logs.length > MAX_LOGS) logs.shift();
}

export function getAnnotationLogs(
  limit = 20,
  config?: ScreenAnnotationConfiguration,
): AnnotationLogEntry[] {
  void config;
  return logs.slice(-limit);
}

export function resetAnnotationLogsForTesting(): void {
  logs.length = 0;
}
