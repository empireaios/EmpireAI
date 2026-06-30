import type { ImprovementApproval, ImprovementApprovalOutcome, ImprovementProposal } from "./types.js";

export function validateApproval(
  proposal: ImprovementProposal,
  approval: ImprovementApproval,
): { valid: boolean; reason: string } {
  if (approval.proposalId !== proposal.proposalId) {
    return { valid: false, reason: "Approval proposalId mismatch" };
  }
  return { valid: true, reason: "Approval valid" };
}

export function canProceedToMissionGeneration(
  approval: ImprovementApproval,
  proposal: ImprovementProposal,
): boolean {
  return (
    approval.outcome === "approved" &&
    proposal.readiness !== "blocked_by_dependencies" &&
    proposal.readiness !== "requires_further_investigation"
  );
}

export function createApproval(
  proposalId: string,
  outcome: ImprovementApprovalOutcome,
  notes?: string,
): ImprovementApproval {
  return {
    proposalId,
    outcome,
    decidedAt: new Date().toISOString(),
    decidedBy: "grand_king",
    notes,
  };
}

export function approvalRecommendation(
  outcome: ImprovementApprovalOutcome,
  proposal: ImprovementProposal,
): string {
  switch (outcome) {
    case "approved":
      return canProceedToMissionGeneration(
        { proposalId: proposal.proposalId, outcome, decidedAt: "", decidedBy: "grand_king" },
        proposal,
      )
        ? "Approved — Mission Planner may generate Cursor mission"
        : "Approved — blocked by readiness; resolve prerequisites first";
    case "rejected":
      return "Proposal rejected — no mission generation";
    case "deferred":
      return "Proposal deferred — retain for future review";
    case "request_revision":
      return "Revise proposal evidence and regenerate from Due Diligence";
  }
}
