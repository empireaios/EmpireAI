/** R1-14 — Marketplace health monitor logging. */

import type { MarketplaceHealthMonitorConfiguration } from "./configuration.js";
import type { MarketplaceHealthLogEntry } from "./types.js";

const logs: MarketplaceHealthLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|consumer_key|consumer_secret|lwa|refresh|credential|authorization|bearer|client[_-]?id|api[_-]?key)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — marketplace credential omitted]";
  }
  return details;
}

export function appendHealthMonitorLog(input: {
  event: string;
  level: MarketplaceHealthLogEntry["level"];
  details: string;
}): MarketplaceHealthLogEntry {
  const entry: MarketplaceHealthLogEntry = {
    logId: `mhm-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getHealthMonitorLogs(
  limit = 50,
  config?: MarketplaceHealthMonitorConfiguration,
): MarketplaceHealthLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetHealthMonitorLogsForTesting(): void {
  logs.length = 0;
}
