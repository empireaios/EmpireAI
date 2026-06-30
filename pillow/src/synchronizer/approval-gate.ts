import type { SyncApproval, SyncApprovalOutcome, SyncPreview } from "./types.js";

export function validateApproval(
  preview: SyncPreview,
  approval: SyncApproval,
): { valid: boolean; reason: string } {
  if (approval.previewId !== preview.previewId) {
    return { valid: false, reason: "Approval previewId does not match preview" };
  }
  if (!preview.approvalRequired && approval.outcome === "approved") {
    return { valid: true, reason: "No approval required — no-op sync" };
  }
  return { valid: true, reason: "Approval record valid" };
}

export function canExecuteSync(
  approval: SyncApproval,
): boolean {
  return approval.outcome === "approved";
}

export function approvalRecommendation(outcome: SyncApprovalOutcome): string {
  switch (outcome) {
    case "approved":
      return "Execute synchronization — apply approved proposals only";
    case "rejected":
      return "Synchronization rejected — no repository writes";
    case "deferred":
      return "Synchronization deferred — preview preserved for later approval";
    case "request_revision":
      return "Revise proposals and regenerate preview before approval";
  }
}

export function createApproval(
  previewId: string,
  outcome: SyncApprovalOutcome,
  notes?: string,
): SyncApproval {
  return {
    previewId,
    outcome,
    decidedAt: new Date().toISOString(),
    decidedBy: "grand_king",
    notes,
  };
}
