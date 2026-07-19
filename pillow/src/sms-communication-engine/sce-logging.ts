/** R4-05 — SMS Communication Engine logging. */

import type { SmsCommunicationEngineConfiguration } from "./configuration.js";
import type { SceLogEntry } from "./types.js";

const logs: SceLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|ssn|card)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive customer value omitted]";
  }
  return details;
}

export function appendSceLog(input: {
  event: string;
  level: SceLogEntry["level"];
  details: string;
}): SceLogEntry {
  const entry: SceLogEntry = {
    logId: `sce-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getSceLogs(
  limit = 50,
  config?: SmsCommunicationEngineConfiguration,
): SceLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetSceLogsForTesting(): void {
  logs.length = 0;
}
