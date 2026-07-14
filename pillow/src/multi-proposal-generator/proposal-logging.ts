/** T4-04 — Multi-Proposal Generator event logging (no sensitive raw values). */

import type { MultiProposalGeneratorConfiguration } from "./configuration.js";
import type { ProposalGeneratorLogEntry } from "./types.js";

const MAX_LOGS = 200;
const logs: ProposalGeneratorLogEntry[] = [];

export function appendProposalLog(input: {
  event: string;
  level: "info" | "warn" | "error";
  details: string;
}): void {
  logs.push({
    logId: `mpg-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: input.details,
  });
  if (logs.length > MAX_LOGS) logs.shift();
}

export function getProposalLogs(
  limit = 20,
  config?: MultiProposalGeneratorConfiguration,
): ProposalGeneratorLogEntry[] {
  void config;
  return logs.slice(-limit);
}

export function resetProposalLogsForTesting(): void {
  logs.length = 0;
}
