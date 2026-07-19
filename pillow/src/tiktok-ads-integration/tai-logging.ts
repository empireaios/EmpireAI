/** R5-04 — TikTok Ads Integration logging. */

import type { TikTokAdsIntegrationConfiguration } from "./configuration.js";
import type { TikTokAdsLogEntry } from "./types.js";

const logs: TikTokAdsLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|advertiser[_-]?token)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive TikTok advertising value omitted]";
  }
  return details;
}

export function appendTaiLog(input: {
  event: string;
  level: TikTokAdsLogEntry["level"];
  details: string;
}): TikTokAdsLogEntry {
  const entry: TikTokAdsLogEntry = {
    logId: `tai-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getTaiLogs(
  limit = 50,
  config?: TikTokAdsIntegrationConfiguration,
): TikTokAdsLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetTaiLogsForTesting(): void {
  logs.length = 0;
}
