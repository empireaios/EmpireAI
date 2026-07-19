/** R5-07 — Campaign Manager logging. */

import type { CampaignManagerConfiguration } from "./configuration.js";
import type { CampaignLogEntry } from "./types.js";

const logs: CampaignLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive marketing value omitted]";
  }
  return details;
}

export function appendCamLog(input: {
  event: string;
  level: CampaignLogEntry["level"];
  details: string;
}): CampaignLogEntry {
  const entry: CampaignLogEntry = {
    logId: `cam-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getCamLogs(
  limit = 50,
  config?: CampaignManagerConfiguration,
): CampaignLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetCamLogsForTesting(): void {
  logs.length = 0;
}
