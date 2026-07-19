/** R4-14 — Customer Risk Engine logging. */

import type { CustomerRiskEngineConfiguration } from "./configuration.js";
import type { CreLogEntry } from "./types.js";

const logs: CreLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|ssn|card)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive customer value omitted]";
  }
  return details;
}

export function appendCreLog(input: {
  event: string;
  level: CreLogEntry["level"];
  details: string;
}): CreLogEntry {
  const entry: CreLogEntry = {
    logId: `cre-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getCreLogs(
  limit = 50,
  config?: CustomerRiskEngineConfiguration,
): CreLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetCreLogsForTesting(): void {
  logs.length = 0;
}
