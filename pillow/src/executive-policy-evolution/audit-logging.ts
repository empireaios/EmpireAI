/** E5-11 — Immutable policy evolution audit history. */

import type { PolicyEvolutionAuditLogEntry } from "./types.js";

const auditStore: PolicyEvolutionAuditLogEntry[] = [];

export function appendPolicyEvolutionAudit(entry: PolicyEvolutionAuditLogEntry): PolicyEvolutionAuditLogEntry {
  auditStore.push({ ...entry });
  return entry;
}

export function getPolicyEvolutionAuditHistory(limit = 100): PolicyEvolutionAuditLogEntry[] {
  return auditStore.slice(-limit);
}

export function createPolicyEvolutionAuditEntry(input: {
  evolutionId: string;
  event: string;
  actor: string;
  previousStatus: string;
  newStatus: string;
  details: string;
}): PolicyEvolutionAuditLogEntry {
  return {
    auditId: `pev-audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    evolutionId: input.evolutionId,
    event: input.event,
    actor: input.actor,
    previousStatus: input.previousStatus,
    newStatus: input.newStatus,
    details: input.details,
    timestamp: new Date().toISOString(),
  };
}

export function resetPolicyEvolutionAuditForTesting(): void {
  auditStore.length = 0;
}
