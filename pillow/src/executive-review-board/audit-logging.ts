/** E5-10 — Immutable review audit history. */

import type { ReviewAuditLogEntry, ReviewStatusLevel } from "./types.js";

const auditStore: ReviewAuditLogEntry[] = [];

export function appendReviewAudit(entry: ReviewAuditLogEntry): ReviewAuditLogEntry {
  auditStore.push({ ...entry });
  return entry;
}

export function getReviewAuditHistory(limit = 100): ReviewAuditLogEntry[] {
  return auditStore.slice(-limit);
}

export function createReviewAuditEntry(input: {
  reviewId: string;
  event: string;
  actor: string;
  previousStatus: string;
  newStatus: string;
  details: string;
}): ReviewAuditLogEntry {
  return {
    auditId: `rev-audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    reviewId: input.reviewId,
    event: input.event,
    actor: input.actor,
    previousStatus: input.previousStatus,
    newStatus: input.newStatus,
    details: input.details,
    timestamp: new Date().toISOString(),
  };
}

export function resetReviewAuditForTesting(): void {
  auditStore.length = 0;
}
