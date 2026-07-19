/** R5-12 — AI Campaign Generator logging. */

import type { AiCampaignGeneratorConfiguration } from "./configuration.js";
import type { AiCampaignLogEntry } from "./types.js";

const logs: AiCampaignLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive advertising credential omitted]";
  }
  return details;
}

export function appendAcgLog(input: {
  event: string;
  level: AiCampaignLogEntry["level"];
  details: string;
}): AiCampaignLogEntry {
  const entry: AiCampaignLogEntry = {
    logId: `acg-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getAcgLogs(
  limit = 50,
  config?: AiCampaignGeneratorConfiguration,
): AiCampaignLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetAcgLogsForTesting(): void {
  logs.length = 0;
}
