/** E5-14 — Immutable resilience audit history. */

import type { ResilienceAuditLogEntry } from "./types.js";

const auditStore: ResilienceAuditLogEntry[] = [];

export function appendResilienceAudit(entry: ResilienceAuditLogEntry): ResilienceAuditLogEntry {
  auditStore.push({ ...entry });
  return entry;
}

export function getResilienceAuditHistory(limit = 100): ResilienceAuditLogEntry[] {
  return auditStore.slice(-limit);
}

export function createResilienceAuditEntry(input: {
  resilienceId: string;
  event: string;
  actor: string;
  previousStatus: string;
  newStatus: string;
  details: string;
}): ResilienceAuditLogEntry {
  return {
    auditId: `res-audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    resilienceId: input.resilienceId,
    event: input.event,
    actor: input.actor,
    previousStatus: input.previousStatus,
    newStatus: input.newStatus,
    details: input.details,
    timestamp: new Date().toISOString(),
  };
}

export function resetResilienceAuditForTesting(): void {
  auditStore.length = 0;
}
