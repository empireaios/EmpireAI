/** T2-01 — UX Rule Engine session logging. */

import type { UxRuleEngineConfiguration } from "./configuration.js";
import type { RuleEngineLogEntry } from "./types.js";

const logs: RuleEngineLogEntry[] = [];

export function appendUxRuleLog(input: {
  event: string;
  level: RuleEngineLogEntry["level"];
  details: string;
}): RuleEngineLogEntry {
  const entry: RuleEngineLogEntry = {
    logId: `ure-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getUxRuleLogs(
  limit = 50,
  config?: UxRuleEngineConfiguration,
): RuleEngineLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetUxRuleLogsForTesting(): void {
  logs.length = 0;
}
