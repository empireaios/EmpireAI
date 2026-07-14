/** R1-06 — Walmart connector logging. */

import type { WalmartMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { WalmartLogEntry } from "./types.js";

const logs: WalmartLogEntry[] = [];
const SENSITIVE_PATTERN = /(token|secret|password|client[_-]?secret|credential|authorization|bearer|client[_-]?id|wm[_-]?sec)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — Walmart credential omitted]";
  }
  return details;
}

export function appendWalmartLog(input: {
  event: string;
  level: WalmartLogEntry["level"];
  details: string;
}): WalmartLogEntry {
  const entry: WalmartLogEntry = {
    logId: `wmt-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getWalmartLogs(
  limit = 50,
  config?: WalmartMarketplaceIntegrationConfiguration,
): WalmartLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetWalmartLogsForTesting(): void {
  logs.length = 0;
}
