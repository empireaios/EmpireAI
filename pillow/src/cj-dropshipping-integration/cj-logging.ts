/** R2-02 — CJdropshipping connector logging. */

import type { CjDropshippingIntegrationConfiguration } from "./configuration.js";
import type { CjLogEntry } from "./types.js";

const logs: CjLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|cj[_-]?api)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — CJdropshipping credential omitted]";
  }
  return details;
}

export function appendCjLog(input: {
  event: string;
  level: CjLogEntry["level"];
  details: string;
}): CjLogEntry {
  const entry: CjLogEntry = {
    logId: `cj-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getCjLogs(
  limit = 50,
  config?: CjDropshippingIntegrationConfiguration,
): CjLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetCjLogsForTesting(): void {
  logs.length = 0;
}
