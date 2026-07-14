/** E5-15 — Immutable cockpit audit history. */

import type { CockpitAuditLogEntry } from "./types.js";

const auditStore: CockpitAuditLogEntry[] = [];

export function appendCockpitAudit(entry: CockpitAuditLogEntry): CockpitAuditLogEntry {
  auditStore.push({ ...entry });
  return entry;
}

export function getCockpitAuditHistory(limit = 100): CockpitAuditLogEntry[] {
  return auditStore.slice(-limit);
}

export function createCockpitAuditEntry(input: {
  widgetId: string;
  event: string;
  actor: string;
  previousStatus: string;
  newStatus: string;
  details: string;
}): CockpitAuditLogEntry {
  return {
    auditId: `gkec-audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    widgetId: input.widgetId,
    event: input.event,
    actor: input.actor,
    previousStatus: input.previousStatus,
    newStatus: input.newStatus,
    details: input.details,
    timestamp: new Date().toISOString(),
  };
}

export function resetCockpitAuditForTesting(): void {
  auditStore.length = 0;
}
