import type { AuthAuditEvent } from "./types.js";
const events: AuthAuditEvent[] = [];
const sensitive = /(api[_-]?key|token|password|secret|bearer|session)(\s*[:=]\s*)([^\s,;]+)/gi;
export const redactSensitive = (value: string) => value.replace(sensitive, "$1$2[REDACTED]");
export function appendAuthAudit(type: string, outcome: AuthAuditEvent["outcome"], userId: string | null, details: string) {
  events.push({ eventId: `atw-evt-${Date.now()}-${events.length + 1}`, timestamp: new Date().toISOString(), type, userId, outcome, details: redactSensitive(details) });
}
export const getAuthAuditEvents = (limit = 100) => events.slice(-Math.max(0, limit)).map((event) => ({ ...event }));
export const resetAtwLogsForTesting = () => { events.length = 0; };
