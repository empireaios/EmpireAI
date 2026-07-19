/** R5-02 — Meta Ads Integration logging. */

import type { MetaAdsIntegrationConfiguration } from "./configuration.js";
import type { MetaLogEntry } from "./types.js";

const logs: MetaLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|ad[_-]?account[_-]?token)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive advertising value omitted]";
  }
  return details;
}

export function appendMaiLog(input: {
  event: string;
  level: MetaLogEntry["level"];
  details: string;
}): MetaLogEntry {
  const entry: MetaLogEntry = {
    logId: `mai-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getMaiLogs(
  limit = 50,
  config?: MetaAdsIntegrationConfiguration,
): MetaLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetMaiLogsForTesting(): void {
  logs.length = 0;
}
