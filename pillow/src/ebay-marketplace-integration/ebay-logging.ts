/** R1-08 — eBay connector logging. */

import type { EbayMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { EbayLogEntry } from "./types.js";

const logs: EbayLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|oauth|refresh|credential|authorization|bearer|client[_-]?id|api[_-]?key)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — eBay credential omitted]";
  }
  return details;
}

export function appendEbayLog(input: {
  event: string;
  level: EbayLogEntry["level"];
  details: string;
}): EbayLogEntry {
  const entry: EbayLogEntry = {
    logId: `ebay-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getEbayLogs(
  limit = 50,
  config?: EbayMarketplaceIntegrationConfiguration,
): EbayLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetEbayLogsForTesting(): void {
  logs.length = 0;
}
