/** E5-09 — Immutable risk audit history. */

import type { RiskAuditLogEntry, RiskStatusLevel } from "./types.js";

const auditStore: RiskAuditLogEntry[] = [];

export function appendRiskAudit(entry: RiskAuditLogEntry): RiskAuditLogEntry {
  auditStore.push({ ...entry });
  return entry;
}

export function getRiskAuditHistory(limit = 100): RiskAuditLogEntry[] {
  return auditStore.slice(-limit);
}

export function createRiskAuditEntry(input: {
  riskId: string;
  event: string;
  actor: string;
  previousStatus: string;
  newStatus: string;
  details: string;
}): RiskAuditLogEntry {
  return {
    auditId: `risk-audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    riskId: input.riskId,
    event: input.event,
    actor: input.actor,
    previousStatus: input.previousStatus,
    newStatus: input.newStatus,
    details: input.details,
    timestamp: new Date().toISOString(),
  };
}

export function logRiskTransition(input: {
  riskId: string;
  actor: string;
  previousStatus: RiskStatusLevel | string;
  newStatus: RiskStatusLevel | string;
  details: string;
}): RiskAuditLogEntry {
  return appendRiskAudit(
    createRiskAuditEntry({
      riskId: input.riskId,
      event: "risk_status_transition",
      actor: input.actor,
      previousStatus: String(input.previousStatus),
      newStatus: String(input.newStatus),
      details: input.details,
    }),
  );
}

export function resetRiskAuditForTesting(): void {
  auditStore.length = 0;
}
