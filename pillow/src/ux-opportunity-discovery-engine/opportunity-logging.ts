/** T5-03 — UX Opportunity Discovery logging. */

import { randomUUID } from "node:crypto";
import type { UxOpportunityDiscoveryConfiguration } from "./configuration.js";
import type { DiscoveryLogEntry } from "./types.js";

const logs: DiscoveryLogEntry[] = [];

export function appendDiscoveryLog(input: {
  event: string;
  level: DiscoveryLogEntry["level"];
  details: string;
}): void {
  logs.push({
    logId: randomUUID(),
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitizeDetails(input.details),
  });
  if (logs.length > 500) logs.splice(0, logs.length - 500);
}

function sanitizeDetails(details: string): string {
  return details
    .replace(/Bearer\s+\S+/gi, "[redacted-token]")
    .replace(/password[=:]\S+/gi, "password=[redacted]")
    .replace(/token[=:]\S+/gi, "token=[redacted]")
    .slice(0, 500);
}

export function getDiscoveryLogs(
  limit = 20,
  config?: UxOpportunityDiscoveryConfiguration,
): DiscoveryLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const rank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = rank[level];
  return logs.filter((entry) => rank[entry.level] >= minRank).slice(-limit);
}

export function resetDiscoveryLogsForTesting(): void {
  logs.length = 0;
}
