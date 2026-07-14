/** E5-12 — Immutable trust audit history. */

import type { TrustAuditLogEntry } from "./types.js";

const auditStore: TrustAuditLogEntry[] = [];

export function appendTrustAudit(entry: TrustAuditLogEntry): TrustAuditLogEntry {
  auditStore.push({ ...entry });
  return entry;
}

export function getTrustAuditHistory(limit = 100): TrustAuditLogEntry[] {
  return auditStore.slice(-limit);
}

export function createTrustAuditEntry(input: {
  trustId: string;
  event: string;
  actor: string;
  previousScore: number;
  newScore: number;
  details: string;
}): TrustAuditLogEntry {
  return {
    auditId: `trust-audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    trustId: input.trustId,
    event: input.event,
    actor: input.actor,
    previousScore: input.previousScore,
    newScore: input.newScore,
    details: input.details,
    timestamp: new Date().toISOString(),
  };
}

export function resetTrustAuditForTesting(): void {
  auditStore.length = 0;
}
