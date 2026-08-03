/** X3-14 — Global Scaling Planner logging. */



import type { GlobalScalingPlannerConfiguration } from "./configuration.js";

import type { GspLogEntry } from "./types.js";



const logs: GspLogEntry[] = [];

const SENSITIVE_PATTERN =

  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|payroll|ssn|salary|wage|operational[_-]?secret|bank[_-]?account|customer[_-]?pii)/i;



function sanitize(details: string): string {

  if (SENSITIVE_PATTERN.test(details)) {

    return "[redacted — sensitive operational or credential data omitted]";

  }

  return details;

}



export function appendGspLog(input: {

  event: string;

  level: GspLogEntry["level"];

  details: string;

}): GspLogEntry {

  const entry: GspLogEntry = {

    logId: `gsp-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,

    timestamp: new Date().toISOString(),

    event: input.event,

    level: input.level,

    details: sanitize(input.details),

  };

  logs.push(entry);

  if (logs.length > 500) logs.splice(0, logs.length - 500);

  return entry;

}



export function getGspLogs(

  limit = 50,

  config?: GlobalScalingPlannerConfiguration,

): GspLogEntry[] {

  const level = config?.loggingLevel ?? "info";

  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;

  const minRank = levelRank[level];

  return logs

    .filter((l) => levelRank[l.level] >= minRank)

    .slice(-limit)

    .map((l) => ({ ...l }));

}



export function resetGspLogsForTesting(): void {

  logs.length = 0;

}


