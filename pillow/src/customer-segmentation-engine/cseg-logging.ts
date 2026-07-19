/** R4-16 — Customer Segmentation Engine logging. */

import type { CustomerSegmentationEngineConfiguration } from "./configuration.js";
import type { CsegLogEntry } from "./types.js";

const logs: CsegLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|ssn|card)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive customer value omitted]";
  }
  return details;
}

export function appendCsegLog(input: {
  event: string;
  level: CsegLogEntry["level"];
  details: string;
}): CsegLogEntry {
  const entry: CsegLogEntry = {
    logId: `cseg-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getCsegLogs(
  limit = 50,
  config?: CustomerSegmentationEngineConfiguration,
): CsegLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetCsegLogsForTesting(): void {
  logs.length = 0;
}
