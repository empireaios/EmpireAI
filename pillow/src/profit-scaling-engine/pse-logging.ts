/** X3-17 — Profit Scaling Engine logging. */



import type { ProfitScalingEngineConfiguration } from "./configuration.js";

import type { PseLogEntry } from "./types.js";



const logs: PseLogEntry[] = [];

const SENSITIVE_PATTERN =

  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token|payroll|ssn|salary|wage|bank[_-]?account|customer[_-]?pii|revenue[_-]?amount|gross[_-]?margin|net[_-]?income|net[_-]?profit|operating[_-]?income|iban|routing[_-]?number)/i;



function sanitize(details: string): string {

  if (SENSITIVE_PATTERN.test(details)) {

    return "[redacted — sensitive financial or credential data omitted]";

  }

  return details;

}



export function appendPseLog(input: {

  event: string;

  level: PseLogEntry["level"];

  details: string;

}): PseLogEntry {

  const entry: PseLogEntry = {

    logId: `pse-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,

    timestamp: new Date().toISOString(),

    event: input.event,

    level: input.level,

    details: sanitize(input.details),

  };

  logs.push(entry);

  if (logs.length > 500) logs.splice(0, logs.length - 500);

  return entry;

}



export function getPseLogs(

  limit = 50,

  config?: ProfitScalingEngineConfiguration,

): PseLogEntry[] {

  const level = config?.loggingLevel ?? "info";

  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;

  const minRank = levelRank[level];

  return logs

    .filter((l) => levelRank[l.level] >= minRank)

    .slice(-limit)

    .map((l) => ({ ...l }));

}



export function resetPseLogsForTesting(): void {

  logs.length = 0;

}

