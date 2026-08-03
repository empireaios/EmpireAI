/** X4-06 — Regional Compliance Engine logging. */

import type { RegionalComplianceEngineConfiguration } from "./configuration.js";
import type { RceLogEntry } from "./types.js";

const logs: RceLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|operational[_-]?secret|ssn|passport|tax[_-]?id)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive operational or compliance data omitted]";
  }
  return details;
}

export function appendRceLog(input: {
  event: string;
  level: RceLogEntry["level"];
  details: string;
}): RceLogEntry {
  const entry: RceLogEntry = {
    logId: `rce-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getRceLogs(
  limit = 50,
  config?: RegionalComplianceEngineConfiguration,
): RceLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetRceLogsForTesting(): void {
  logs.length = 0;
}
