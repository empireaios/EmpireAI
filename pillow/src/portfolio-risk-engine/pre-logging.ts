/** X2-07 — Portfolio Risk Engine logging. */

import type { PortfolioRiskEngineConfiguration } from "./configuration.js";
import type { RiskLogEntry } from "./types.js";

const logs: RiskLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive enterprise credential omitted]";
  }
  return details;
}

export function appendPreLog(input: {
  event: string;
  level: RiskLogEntry["level"];
  details: string;
}): RiskLogEntry {
  const entry: RiskLogEntry = {
    logId: `pre-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getPreLogs(
  limit = 50,
  config?: PortfolioRiskEngineConfiguration,
): RiskLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetPreLogsForTesting(): void {
  logs.length = 0;
}
