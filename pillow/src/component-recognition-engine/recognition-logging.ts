/** T1-03 — Recognition session logging. */

import type { ComponentRecognitionConfiguration } from "./configuration.js";
import type { RecognitionLogEntry } from "./types.js";

const logs: RecognitionLogEntry[] = [];

export function appendRecognitionLog(input: {
  event: string;
  level: RecognitionLogEntry["level"];
  details: string;
}): RecognitionLogEntry {
  const entry: RecognitionLogEntry = {
    logId: `cre-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getRecognitionLogs(
  limit = 50,
  config?: ComponentRecognitionConfiguration,
): RecognitionLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetRecognitionLogsForTesting(): void {
  logs.length = 0;
}
