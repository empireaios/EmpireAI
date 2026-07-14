/** R1-03 — Amazon product intelligence logging. */

import type { AmazonProductIntelligenceConfiguration } from "./configuration.js";
import type { AmazonProductLogEntry } from "./types.js";

const logs: AmazonProductLogEntry[] = [];
const SENSITIVE_PATTERN = /(token|secret|password|lwa|refresh|credential|authorization|bearer|client[_-]?id)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — Amazon credential omitted]";
  }
  return details;
}

export function appendProductLog(input: {
  event: string;
  level: AmazonProductLogEntry["level"];
  details: string;
}): AmazonProductLogEntry {
  const entry: AmazonProductLogEntry = {
    logId: `amzprod-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getProductLogs(
  limit = 50,
  config?: AmazonProductIntelligenceConfiguration,
): AmazonProductLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetProductLogsForTesting(): void {
  logs.length = 0;
}
