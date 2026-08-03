/** X4-13 — Global Talent Intelligence logging. */

import type { GlobalTalentIntelligenceConfiguration } from "./configuration.js";
import type { TalLogEntry } from "./types.js";

const logs: TalLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|salary|compensation|ssn|employee[_-]?id|personal[_-]?data)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive workforce data omitted]";
  }
  return details;
}

export function appendTalLog(input: {
  event: string;
  level: TalLogEntry["level"];
  details: string;
}): TalLogEntry {
  const entry: TalLogEntry = {
    logId: `tal-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getTalLogs(
  limit = 50,
  config?: GlobalTalentIntelligenceConfiguration,
): TalLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetTalLogsForTesting(): void {
  logs.length = 0;
}
