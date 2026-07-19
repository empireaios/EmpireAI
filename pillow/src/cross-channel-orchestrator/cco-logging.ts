/** R5-18 — Cross-Channel Orchestrator logging. */

import type { CrossChannelOrchestratorConfiguration } from "./configuration.js";
import type { OrchestrationLogEntry } from "./types.js";

const logs: OrchestrationLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — sensitive advertising credential omitted]";
  }
  return details;
}

export function appendCcoLog(input: {
  event: string;
  level: OrchestrationLogEntry["level"];
  details: string;
}): OrchestrationLogEntry {
  const entry: OrchestrationLogEntry = {
    logId: `cco-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getCcoLogs(
  limit = 50,
  config?: CrossChannelOrchestratorConfiguration,
): OrchestrationLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetCcoLogsForTesting(): void {
  logs.length = 0;
}
