import {

  POOR_ROI_THRESHOLD,

  PROPOSAL_INITIAL_STATUS,

  PROPOSAL_REQUIRED_FIELDS,

  RECOMMENDATION_EVIDENCE_FIELDS,

  COST_AWARENESS_FIELDS,

} from "./constitution.js";

import type { ImplementationProposal, ProposalStatus } from "./types.js";



type ProposalInput = Pick<

  ImplementationProposal,

  "title" | "reason" | "businessValue" | "profitImpact" | "repositoryImpact"

> &

  Partial<Omit<ImplementationProposal, "title" | "reason">>;



/**

 * Build a constitution-compliant implementation proposal.

 * Status defaults to Awaiting Grand King — Cursor work requires explicit approval.

 */

export function createImplementationProposal(input: ProposalInput): ImplementationProposal {

  return {

    proposalId: input.proposalId,

    title: input.title,

    reason: input.reason,

    businessValue: input.businessValue,

    profitImpact: input.profitImpact,

    repositoryImpact: input.repositoryImpact,

    estimatedEngineeringTime: input.estimatedEngineeringTime ?? "Not estimated",

    estimatedOpenAiCost: input.estimatedOpenAiCost ?? "Not estimated",

    infrastructureCost: input.infrastructureCost ?? "Not estimated",

    opportunityCost: input.opportunityCost ?? "Not assessed",

    expectedRoi: input.expectedRoi ?? "Not assessed",

    risk: input.risk ?? "Not assessed",

    affectedFiles: input.affectedFiles ?? [],

    objectiveAlignment: input.objectiveAlignment ?? "Pending objective evaluation",

    recommendation: input.recommendation ?? input.reason,

    evidence: input.evidence ?? [],

    assumptions: input.assumptions ?? [],

    confidenceLevel: input.confidenceLevel ?? "Not assessed",

    alternatives: input.alternatives ?? [],

    status: input.status ?? PROPOSAL_INITIAL_STATUS,

    missionId: input.missionId,

    metadata: input.metadata,

  };

}



function fieldMissing(proposal: ImplementationProposal, field: string): boolean {

  const value = proposal[field as keyof ImplementationProposal];

  if (value === undefined || value === null) return true;

  if (Array.isArray(value)) return value.length === 0;

  if (typeof value === "string") {

    const trimmed = value.trim();

    return trimmed.length === 0 || /^not (estimated|assessed)$/i.test(trimmed);

  }

  return false;

}



/** LAW 2 — recommendations without evidence are not permitted. */

export function validateRecommendationEvidence(proposal: ImplementationProposal): {

  valid: boolean;

  missingFields: string[];

} {

  const missingFields = RECOMMENDATION_EVIDENCE_FIELDS.filter((field) =>

    fieldMissing(proposal, field),

  );

  return { valid: missingFields.length === 0, missingFields };

}



/** LAW 3 — cost awareness required on every proposal. */

export function validateCostAwareness(proposal: ImplementationProposal): {

  valid: boolean;

  missingFields: string[];

  poorRoi: boolean;

} {

  const missingFields = COST_AWARENESS_FIELDS.filter((field) => fieldMissing(proposal, field));

  const roiMatch = proposal.expectedRoi.match(/(-?\d+(\.\d+)?)/);

  const roiValue = roiMatch ? Number.parseFloat(roiMatch[1]!) : null;

  const poorRoi = roiValue !== null && roiValue < POOR_ROI_THRESHOLD;

  return {

    valid: missingFields.length === 0 && !poorRoi,

    missingFields,

    poorRoi,

  };

}



export function validateProposalForCursorWork(proposal: ImplementationProposal): {

  valid: boolean;

  missingFields: string[];

  approved: boolean;

  evidenceValid: boolean;

  costAware: boolean;

  poorRoi: boolean;

} {

  const missingFields = PROPOSAL_REQUIRED_FIELDS.filter((field) => fieldMissing(proposal, field));

  const evidence = validateRecommendationEvidence(proposal);

  const cost = validateCostAwareness(proposal);

  const approved = isGrandKingApproved(proposal.status);



  return {

    valid:

      missingFields.length === 0 && evidence.valid && cost.valid && !cost.poorRoi,

    missingFields,

    approved,

    evidenceValid: evidence.valid,

    costAware: cost.valid,

    poorRoi: cost.poorRoi,

  };

}



/** Cursor Sovereignty — execution requires Grand King approval, never automatic. */

export function mayGenerateCursorWork(proposal: ImplementationProposal): boolean {

  const { valid, approved } = validateProposalForCursorWork(proposal);

  return valid && approved;

}



export function isGrandKingApproved(status: ProposalStatus): boolean {

  return status === "approved";

}


