/** E5-08 — Immutable exception audit history. */

import type { ExceptionAuditLogEntry, ExceptionLifecycleState } from "./types.js";

const auditStore: ExceptionAuditLogEntry[] = [];

export function appendExceptionAudit(entry: ExceptionAuditLogEntry): ExceptionAuditLogEntry {
  auditStore.push({ ...entry });
  return entry;
}

export function getExceptionAuditHistory(limit = 100): ExceptionAuditLogEntry[] {
  return auditStore.slice(-limit);
}

export function getExceptionAuditForId(exceptionId: string): ExceptionAuditLogEntry[] {
  return auditStore.filter((e) => e.exceptionId === exceptionId);
}

export function createAuditEntry(input: {
  exceptionId: string;
  event: string;
  actor: string;
  previousStatus: string;
  newStatus: string;
  details: string;
}): ExceptionAuditLogEntry {
  return {
    auditId: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    exceptionId: input.exceptionId,
    event: input.event,
    actor: input.actor,
    previousStatus: input.previousStatus,
    newStatus: input.newStatus,
    details: input.details,
    timestamp: new Date().toISOString(),
  };
}

export function resetExceptionAuditForTesting(): void {
  auditStore.length = 0;
}

export function logLifecycleTransition(input: {
  exceptionId: string;
  actor: string;
  previousStatus: ExceptionLifecycleState | string;
  newStatus: ExceptionLifecycleState | string;
  details: string;
}): ExceptionAuditLogEntry {
  const entry = createAuditEntry({
    exceptionId: input.exceptionId,
    event: `status_change:${input.previousStatus}_to_${input.newStatus}`,
    actor: input.actor,
    previousStatus: input.previousStatus,
    newStatus: input.newStatus,
    details: input.details,
  });
  return appendExceptionAudit(entry);
}
