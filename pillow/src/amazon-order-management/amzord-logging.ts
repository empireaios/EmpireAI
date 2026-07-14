/** R1-04 — Amazon order management logging. */

import type { AmazonOrderManagementConfiguration } from "./configuration.js";
import type { AmazonOrderLogEntry } from "./types.js";

const logs: AmazonOrderLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|lwa|refresh|credential|authorization|bearer|client[_-]?id|buyer[_-]?email|buyer[_-]?name|customer[_-]?name|address)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive order data omitted]";
  }
  return details;
}

export function appendOrderLog(input: {
  event: string;
  level: AmazonOrderLogEntry["level"];
  details: string;
}): AmazonOrderLogEntry {
  const entry: AmazonOrderLogEntry = {
    logId: `amzord-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getOrderLogs(
  limit = 50,
  config?: AmazonOrderManagementConfiguration,
): AmazonOrderLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetOrderLogsForTesting(): void {
  logs.length = 0;
}
