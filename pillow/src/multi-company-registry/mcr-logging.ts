/** X2-02 — Multi-Company Registry logging. */

import type { MultiCompanyRegistryConfiguration } from "./configuration.js";
import type { RegistryLogEntry } from "./types.js";

const logs: RegistryLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive enterprise credential omitted]";
  }
  return details;
}

export function appendMcrLog(input: {
  event: string;
  level: RegistryLogEntry["level"];
  details: string;
}): RegistryLogEntry {
  const entry: RegistryLogEntry = {
    logId: `mcr-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getMcrLogs(
  limit = 50,
  config?: MultiCompanyRegistryConfiguration,
): RegistryLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetMcrLogsForTesting(): void {
  logs.length = 0;
}
