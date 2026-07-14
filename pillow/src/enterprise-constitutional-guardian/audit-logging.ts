/** E5-13 — Immutable guardian audit history. */

import type { GuardianAuditLogEntry } from "./types.js";

const auditStore: GuardianAuditLogEntry[] = [];

export function appendGuardianAudit(entry: GuardianAuditLogEntry): GuardianAuditLogEntry {
  auditStore.push({ ...entry });
  return entry;
}

export function getGuardianAuditHistory(limit = 100): GuardianAuditLogEntry[] {
  return auditStore.slice(-limit);
}

export function createGuardianAuditEntry(input: {
  guardianEventId: string;
  event: string;
  actor: string;
  previousStatus: string;
  newStatus: string;
  details: string;
}): GuardianAuditLogEntry {
  return {
    auditId: `guard-audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    guardianEventId: input.guardianEventId,
    event: input.event,
    actor: input.actor,
    previousStatus: input.previousStatus,
    newStatus: input.newStatus,
    details: input.details,
    timestamp: new Date().toISOString(),
  };
}

export function resetGuardianAuditForTesting(): void {
  auditStore.length = 0;
}
