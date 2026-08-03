/** X2-20 — Autonomous Portfolio Board logging. */

import type { AutonomousPortfolioBoardConfiguration } from "./configuration.js";
import type { ExecutiveBoardLogEntry } from "./types.js";

const logs: ExecutiveBoardLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|ssn|bank[_-]?account|account[_-]?number|routing[_-]?number|credit[_-]?card|financial[_-]?secret|salary|revenue[_-]?detail|profit[_-]?margin|balance[_-]?sheet|enterprise[_-]?secret)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive enterprise or credential data omitted]";
  }
  return details;
}

export function appendApbLog(input: {
  event: string;
  level: ExecutiveBoardLogEntry["level"];
  details: string;
}): ExecutiveBoardLogEntry {
  const entry: ExecutiveBoardLogEntry = {
    logId: `apb-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getApbLogs(
  limit = 50,
  config?: AutonomousPortfolioBoardConfiguration,
): ExecutiveBoardLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetApbLogsForTesting(): void {
  logs.length = 0;
}
