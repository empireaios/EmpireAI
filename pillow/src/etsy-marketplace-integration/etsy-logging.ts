/** R1-07 — Etsy connector logging. */

import type { EtsyMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { EtsyLogEntry } from "./types.js";

const logs: EtsyLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|oauth|refresh|credential|authorization|bearer|client[_-]?id|api[_-]?key)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — Etsy credential omitted]";
  }
  return details;
}

export function appendEtsyLog(input: {
  event: string;
  level: EtsyLogEntry["level"];
  details: string;
}): EtsyLogEntry {
  const entry: EtsyLogEntry = {
    logId: `etsy-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getEtsyLogs(
  limit = 50,
  config?: EtsyMarketplaceIntegrationConfiguration,
): EtsyLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetEtsyLogsForTesting(): void {
  logs.length = 0;
}
