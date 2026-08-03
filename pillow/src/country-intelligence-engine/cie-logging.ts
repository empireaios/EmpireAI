/** X4-02 — Country Intelligence Engine logging. */

import type { CountryIntelligenceEngineConfiguration } from "./configuration.js";
import type { CieLogEntry } from "./types.js";

const logs: CieLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|operational[_-]?secret)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive operational or credential data omitted]";
  }
  return details;
}

export function appendCieLog(input: {
  event: string;
  level: CieLogEntry["level"];
  details: string;
}): CieLogEntry {
  const entry: CieLogEntry = {
    logId: `cie-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getCieLogs(
  limit = 50,
  config?: CountryIntelligenceEngineConfiguration,
): CieLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetCieLogsForTesting(): void {
  logs.length = 0;
}
