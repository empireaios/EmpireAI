/** T5-10 — Visual Intelligence Certification logging. */

import type { VisualIntelligenceCertificationConfiguration } from "./configuration.js";
import type { CertificationLogEntry } from "./types.js";

const logs: CertificationLogEntry[] = [];

export function appendCertificationLog(input: {
  event: string;
  level: CertificationLogEntry["level"];
  details: string;
}): CertificationLogEntry {
  const entry: CertificationLogEntry = {
    logId: `vic-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getCertificationLogs(
  limit = 50,
  config?: VisualIntelligenceCertificationConfiguration,
): CertificationLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetCertificationLogsForTesting(): void {
  logs.length = 0;
}
