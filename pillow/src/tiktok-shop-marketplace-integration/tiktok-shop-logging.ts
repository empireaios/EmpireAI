/** R1-09 — TikTok Shop connector logging. */

import type { TikTokShopMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { TikTokShopLogEntry } from "./types.js";

const logs: TikTokShopLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|oauth|refresh|credential|authorization|bearer|client[_-]?id|api[_-]?key|shop[_-]?cipher)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — TikTok Shop credential omitted]";
  }
  return details;
}

export function appendTikTokShopLog(input: {
  event: string;
  level: TikTokShopLogEntry["level"];
  details: string;
}): TikTokShopLogEntry {
  const entry: TikTokShopLogEntry = {
    logId: `tts-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getTikTokShopLogs(
  limit = 50,
  config?: TikTokShopMarketplaceIntegrationConfiguration,
): TikTokShopLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetTikTokShopLogsForTesting(): void {
  logs.length = 0;
}
