/** X3-10 — Bottleneck Intelligence logging. */

import type { BottleneckIntelligenceConfiguration } from "./configuration.js";
import type { BniLogEntry } from "./types.js";

const logs: BniLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|payroll|ssn|salary|wage|operational[_-]?secret|bank[_-]?account)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive operational or credential data omitted]";
  }
  return details;
}

export function appendBniLog(input: {
  event: string;
  level: BniLogEntry["level"];
  details: string;
}): BniLogEntry {
  const entry: BniLogEntry = {
    logId: `bni-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getBniLogs(
  limit = 50,
  config?: BottleneckIntelligenceConfiguration,
): BniLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetBniLogsForTesting(): void {
  logs.length = 0;
}
