/** X2-15 — Acquisition Evaluation Engine logging. */

import type { AcquisitionEvaluationEngineConfiguration } from "./configuration.js";
import type { AcquisitionLogEntry } from "./types.js";

const logs: AcquisitionLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|ssn|bank[_-]?account)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive enterprise or credential data omitted]";
  }
  return details;
}

export function appendAeeLog(input: {
  event: string;
  level: AcquisitionLogEntry["level"];
  details: string;
}): AcquisitionLogEntry {
  const entry: AcquisitionLogEntry = {
    logId: `aee-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getAeeLogs(
  limit = 50,
  config?: AcquisitionEvaluationEngineConfiguration,
): AcquisitionLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetAeeLogsForTesting(): void {
  logs.length = 0;
}
