import type { AuthorizationAuditEvent } from "./types.js";
const events: AuthorizationAuditEvent[] = [];
const redact = (value: unknown) => String(value ?? "").replace(/(token|password|secret|bearer)=?[^,\s]*/gi, "$1=[REDACTED]");
export function logAuthorizationEvent(type: string, principalId: string | null, outcome: AuthorizationAuditEvent["outcome"], details: unknown) {
  const event = { eventId: `azw-evt-${Date.now()}-${events.length + 1}`, timestamp: new Date().toISOString(), type, principalId, outcome, details: redact(details) };
  events.push(event); return { ...event };
}
export const getAuthorizationLogEvents = (limit = 100) => events.slice(-Math.max(0, limit)).map((event) => ({ ...event }));
export const resetAzwLogsForTesting = () => { events.length = 0; };
