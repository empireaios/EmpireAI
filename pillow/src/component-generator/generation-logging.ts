/** T3-02 — Component Generator logging. */

import type { ComponentGeneratorConfiguration } from "./configuration.js";
import type { ComponentGeneratorLogEntry } from "./types.js";

const logs: ComponentGeneratorLogEntry[] = [];

export function appendGenerationLog(input: {
  event: string;
  level: ComponentGeneratorLogEntry["level"];
  details: string;
}): ComponentGeneratorLogEntry {
  const entry: ComponentGeneratorLogEntry = {
    logId: `cg-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getGenerationLogs(
  limit = 50,
  config?: ComponentGeneratorConfiguration,
): ComponentGeneratorLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetGenerationLogsForTesting(): void {
  logs.length = 0;
}
