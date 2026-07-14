/** T1-01 — Capture event logging. */

import type { VisualCaptureConfiguration } from "./configuration.js";
import type { CaptureLogEntry } from "./types.js";

const LOG_STORE: CaptureLogEntry[] = [];
const LEVEL_RANK = { debug: 0, info: 1, warn: 2, error: 3 } as const;

export function appendCaptureLog(input: {
  event: string;
  level: CaptureLogEntry["level"];
  details: string;
}): CaptureLogEntry {
  const entry: CaptureLogEntry = {
    logId: `vce-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  };
  LOG_STORE.push(entry);
  if (LOG_STORE.length > 500) LOG_STORE.splice(0, LOG_STORE.length - 500);
  return entry;
}

export function getCaptureLogs(limit = 50, config?: VisualCaptureConfiguration): CaptureLogEntry[] {
  const minLevel = config ? LEVEL_RANK[config.loggingLevel] : 0;
  return LOG_STORE.filter((e) => LEVEL_RANK[e.level] >= minLevel).slice(-limit);
}

export function resetCaptureLogsForTesting(): void {
  LOG_STORE.length = 0;
}
