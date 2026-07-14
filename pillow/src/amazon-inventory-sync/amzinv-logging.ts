/** R1-05 — Amazon inventory sync logging. */

import type { AmazonInventorySyncConfiguration } from "./configuration.js";
import type { AmazonInventoryLogEntry } from "./types.js";

const logs: AmazonInventoryLogEntry[] = [];
const SENSITIVE_PATTERN = /(token|secret|password|lwa|refresh|credential|authorization|bearer|client[_-]?id)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — Amazon credential omitted]";
  }
  return details;
}

export function appendInventoryLog(input: {
  event: string;
  level: AmazonInventoryLogEntry["level"];
  details: string;
}): AmazonInventoryLogEntry {
  const entry: AmazonInventoryLogEntry = {
    logId: `amzinv-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getInventoryLogs(
  limit = 50,
  config?: AmazonInventorySyncConfiguration,
): AmazonInventoryLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetInventoryLogsForTesting(): void {
  logs.length = 0;
}
