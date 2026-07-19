/** R5-20 — Real World Operations Certification logging. */

import type { RealWorldOperationsCertificationConfiguration } from "./configuration.js";
import type { RealWorldOperationsCertificationLogEntry } from "./types.js";

const logs: RealWorldOperationsCertificationLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|ssn|card)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive operational credential omitted]";
  }
  return details;
}

export function appendRwocLog(input: {
  event: string;
  level: RealWorldOperationsCertificationLogEntry["level"];
  details: string;
}): RealWorldOperationsCertificationLogEntry {
  const entry: RealWorldOperationsCertificationLogEntry = {
    logId: `rwoc-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getRwocLogs(
  limit = 50,
  config?: RealWorldOperationsCertificationConfiguration,
): RealWorldOperationsCertificationLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetRwocLogsForTesting(): void {
  logs.length = 0;
}
