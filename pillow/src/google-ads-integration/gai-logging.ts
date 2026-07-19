/** R5-03 — Google Ads Integration logging. */

import type { GoogleAdsIntegrationConfiguration } from "./configuration.js";
import type { GoogleAdsLogEntry } from "./types.js";

const logs: GoogleAdsLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|ad[_-]?account[_-]?token)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive Google advertising value omitted]";
  }
  return details;
}

export function appendGaiLog(input: {
  event: string;
  level: GoogleAdsLogEntry["level"];
  details: string;
}): GoogleAdsLogEntry {
  const entry: GoogleAdsLogEntry = {
    logId: `gai-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getGaiLogs(
  limit = 50,
  config?: GoogleAdsIntegrationConfiguration,
): GoogleAdsLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetGaiLogsForTesting(): void {
  logs.length = 0;
}
