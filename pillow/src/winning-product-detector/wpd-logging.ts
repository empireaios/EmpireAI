/** X3-02 — Winning Product Detector logging. */

import type { WinningProductDetectorConfiguration } from "./configuration.js";
import type { WpdLogEntry } from "./types.js";

const logs: WpdLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|operational[_-]?secret)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive operational or credential data omitted]";
  }
  return details;
}

export function appendWpdLog(input: {
  event: string;
  level: WpdLogEntry["level"];
  details: string;
}): WpdLogEntry {
  const entry: WpdLogEntry = {
    logId: `wpd-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getWpdLogs(
  limit = 50,
  config?: WinningProductDetectorConfiguration,
): WpdLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetWpdLogsForTesting(): void {
  logs.length = 0;
}
