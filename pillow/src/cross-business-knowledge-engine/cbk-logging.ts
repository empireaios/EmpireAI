/** X2-04 — Cross-Business Knowledge Engine logging. */

import type { CrossBusinessKnowledgeEngineConfiguration } from "./configuration.js";
import type { KnowledgeLogEntry } from "./types.js";

const logs: KnowledgeLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|confidential)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive enterprise credential omitted]";
  }
  return details;
}

export function appendCbkLog(input: {
  event: string;
  level: KnowledgeLogEntry["level"];
  details: string;
}): KnowledgeLogEntry {
  const entry: KnowledgeLogEntry = {
    logId: `cbk-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getCbkLogs(
  limit = 50,
  config?: CrossBusinessKnowledgeEngineConfiguration,
): KnowledgeLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetCbkLogsForTesting(): void {
  logs.length = 0;
}
