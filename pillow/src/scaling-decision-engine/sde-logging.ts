/** X3-03 — Scaling Decision Engine logging. */

import type { ScalingDecisionEngineConfiguration } from "./configuration.js";
import type { SdeLogEntry } from "./types.js";

const logs: SdeLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|operational[_-]?secret)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive operational or credential data omitted]";
  }
  return details;
}

export function appendSdeLog(input: {
  event: string;
  level: SdeLogEntry["level"];
  details: string;
}): SdeLogEntry {
  const entry: SdeLogEntry = {
    logId: `sde-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getSdeLogs(
  limit = 50,
  config?: ScalingDecisionEngineConfiguration,
): SdeLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetSdeLogsForTesting(): void {
  logs.length = 0;
}
