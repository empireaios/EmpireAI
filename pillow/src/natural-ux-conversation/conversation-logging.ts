/** T4-01 — Natural UX Conversation event logging. */

import type { NaturalUxConversationConfiguration } from "./configuration.js";
import type { ConversationLogEntry } from "./types.js";

const MAX_LOGS = 200;
const logs: ConversationLogEntry[] = [];

export function appendConversationLog(input: {
  event: string;
  level: "info" | "warn" | "error";
  details: string;
}): void {
  logs.push({
    logId: `nuc-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  });
  if (logs.length > MAX_LOGS) logs.shift();
}

export function getConversationLogs(
  limit = 20,
  config?: NaturalUxConversationConfiguration,
): ConversationLogEntry[] {
  void config;
  return logs.slice(-limit);
}

export function resetConversationLogsForTesting(): void {
  logs.length = 0;
}
