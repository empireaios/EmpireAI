import type { EmpireIntelligenceFrameworkConfiguration } from "./configuration.js";
export type EifLogEntry = { timestamp: string; event: string; level: "info"|"warn"|"error"; details: string };
const logs: EifLogEntry[] = [];
function redact(value: string): string {
  return value.replace(/(api[_-]?key|token|bearer|password|secret)\s*[=:]?\s*[^\s,;]+/gi, "$1=[redacted]");
}
export function appendEifLog(entry: Omit<EifLogEntry, "timestamp">): void {
  logs.push({ ...entry, timestamp: new Date().toISOString(), details: redact(entry.details) });
  if (logs.length > 200) logs.shift();
}
export function getEifLogs(limit = 20, _config?: EmpireIntelligenceFrameworkConfiguration): EifLogEntry[] {
  return logs.slice(-limit);
}
export function resetEifLogsForTesting(): void { logs.length = 0; }
