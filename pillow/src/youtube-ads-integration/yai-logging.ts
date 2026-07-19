/** R5-05 — YouTube Ads Integration logging. */

import type { YouTubeAdsIntegrationConfiguration } from "./configuration.js";
import type { YouTubeAdsLogEntry } from "./types.js";

const logs: YouTubeAdsLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|developer[_-]?token)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive YouTube advertising value omitted]";
  }
  return details;
}

export function appendYaiLog(input: {
  event: string;
  level: YouTubeAdsLogEntry["level"];
  details: string;
}): YouTubeAdsLogEntry {
  const entry: YouTubeAdsLogEntry = {
    logId: `yai-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getYaiLogs(
  limit = 50,
  config?: YouTubeAdsIntegrationConfiguration,
): YouTubeAdsLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetYaiLogsForTesting(): void {
  logs.length = 0;
}
