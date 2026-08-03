/** X4-12 — International Partnership Engine logging. */

import type { InternationalPartnershipEngineConfiguration } from "./configuration.js";
import type { IpeLogEntry } from "./types.js";

const logs: IpeLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|partner[_-]?contract|deal[_-]?terms|commission[_-]?rate)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive partnership data omitted]";
  }
  return details;
}

export function appendIpeLog(input: {
  event: string;
  level: IpeLogEntry["level"];
  details: string;
}): IpeLogEntry {
  const entry: IpeLogEntry = {
    logId: `ipe-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getIpeLogs(
  limit = 50,
  config?: InternationalPartnershipEngineConfiguration,
): IpeLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetIpeLogsForTesting(): void {
  logs.length = 0;
}
