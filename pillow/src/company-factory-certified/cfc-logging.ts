/** X1-15 — Company Factory Certified logging. */

import type { CompanyFactoryCertifiedConfiguration } from "./configuration.js";
import type { CertificationLogEntry } from "./types.js";

const logs: CertificationLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive operational credential omitted]";
  }
  return details;
}

export function appendCfcLog(input: {
  event: string;
  level: CertificationLogEntry["level"];
  details: string;
}): CertificationLogEntry {
  const entry: CertificationLogEntry = {
    logId: `cfc-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getCfcLogs(
  limit = 50,
  config?: CompanyFactoryCertifiedConfiguration,
): CertificationLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetCfcLogsForTesting(): void {
  logs.length = 0;
}
