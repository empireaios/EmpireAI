/** R5-11 — Creative Asset Manager logging. */

import type { CreativeAssetManagerConfiguration } from "./configuration.js";
import type { CreativeLogEntry } from "./types.js";

const logs: CreativeLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|storage[_-]?key)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive creative/storage credential omitted]";
  }
  return details;
}

export function appendCraLog(input: {
  event: string;
  level: CreativeLogEntry["level"];
  details: string;
}): CreativeLogEntry {
  const entry: CreativeLogEntry = {
    logId: `cra-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getCraLogs(
  limit = 50,
  config?: CreativeAssetManagerConfiguration,
): CreativeLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetCraLogsForTesting(): void {
  logs.length = 0;
}
