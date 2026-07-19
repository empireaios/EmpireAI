/** R1-15 — Marketplace certification logging. */

import type { MarketplaceCertificationConfiguration } from "./configuration.js";
import type { MarketplaceCertificationLogEntry } from "./types.js";

const logs: MarketplaceCertificationLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|consumer_key|consumer_secret|lwa|refresh|credential|authorization|bearer|client[_-]?id|api[_-]?key)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — marketplace credential omitted]";
  }
  return details;
}

export function appendCertificationLog(input: {
  event: string;
  level: MarketplaceCertificationLogEntry["level"];
  details: string;
}): MarketplaceCertificationLogEntry {
  const entry: MarketplaceCertificationLogEntry = {
    logId: `mct-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getCertificationLogs(
  limit = 50,
  config?: MarketplaceCertificationConfiguration,
): MarketplaceCertificationLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetCertificationLogsForTesting(): void {
  logs.length = 0;
}
