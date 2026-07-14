/** T4-02 — Voice UX Commands event logging (no raw audio / secrets). */

import type { VoiceUxCommandsConfiguration } from "./configuration.js";
import type { VoiceCommandLogEntry } from "./types.js";

const MAX_LOGS = 200;
const logs: VoiceCommandLogEntry[] = [];

export function appendVoiceCommandLog(input: {
  event: string;
  level: "info" | "warn" | "error";
  details: string;
}): void {
  logs.push({
    logId: `vuc-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  });
  if (logs.length > MAX_LOGS) logs.shift();
}

export function getVoiceCommandLogs(
  limit = 20,
  config?: VoiceUxCommandsConfiguration,
): VoiceCommandLogEntry[] {
  void config;
  return logs.slice(-limit);
}

export function resetVoiceCommandLogsForTesting(): void {
  logs.length = 0;
}
