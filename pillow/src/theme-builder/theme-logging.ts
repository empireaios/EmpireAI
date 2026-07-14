/** T3-04 — Theme Builder event logging. */

import type { ThemeBuilderConfiguration } from "./configuration.js";
import type { ThemeBuilderLogEntry } from "./types.js";

const MAX_LOGS = 200;
const logs: ThemeBuilderLogEntry[] = [];

export function appendThemeLog(input: {
  event: string;
  level: "info" | "warn" | "error";
  details: string;
}): void {
  logs.push({
    logId: `tb-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  });
  if (logs.length > MAX_LOGS) logs.shift();
}

export function getThemeLogs(
  limit = 20,
  config?: ThemeBuilderConfiguration,
): ThemeBuilderLogEntry[] {
  void config;
  return logs.slice(-limit);
}

export function resetThemeLogsForTesting(): void {
  logs.length = 0;
}
