/** T4-08 — Preference Learning in-memory logging. */

import type { PreferenceLogEntry } from "./types.js";
import type { PreferenceLearningConfiguration } from "./configuration.js";

const logs: PreferenceLogEntry[] = [];

export function appendPreferenceLog(entry: {
  event: string;
  level: "info" | "warn" | "error";
  details: string;
}): void {
  logs.push({
    logId: `pl-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  });
  if (logs.length > 500) logs.splice(0, logs.length - 500);
}

export function getPreferenceLogs(
  limit = 20,
  config?: PreferenceLearningConfiguration,
): PreferenceLogEntry[] {
  void config;
  return logs.slice(-limit);
}

export function resetPreferenceLogsForTesting(): void {
  logs.length = 0;
}
