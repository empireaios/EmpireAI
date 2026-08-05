import type {

  ExecutiveAcceptancePackCollection,

  GkagtInput,

  GrandKingDecision,

  PrerequisiteVerification,

} from "./types.js";



export type GateInputs = {

  prerequisites: PrerequisiteVerification;

  packCollection: ExecutiveAcceptancePackCollection;

  input: GkagtInput;

  explicitDecision: GrandKingDecision;

};



/** Resolve Grand King decision — NEVER auto-approve. */

export function resolveGrandKingDecision(input: GkagtInput): GrandKingDecision {

  if (input.deferDecision === true) return "defer";

  if (input.grandKingDecision === "approve" || input.grandKingDecision === "reject" || input.grandKingDecision === "defer") {

    return input.grandKingDecision;

  }

  return "pending";

}



export function canAuthoriseDeployment(inputs: GateInputs): {

  authorised: boolean;

  reason: string[];

} {

  const reasons: string[] = [];



  if (inputs.input.fabricateApprovalEvidence || inputs.input.bypassGrandKingApproval || inputs.input.authoriseWithoutApproval) {

    return { authorised: false, reason: ["boundary violation — authorisation rejected"] };

  }



  if (inputs.input.overrideFailedCertifications || inputs.input.forceApprove) {

    return { authorised: false, reason: ["override/force flags rejected — prerequisites cannot be bypassed"] };

  }



  if (inputs.explicitDecision !== "approve") {

    reasons.push(`grandKingDecision=${inputs.explicitDecision} — approve required for authorisation`);

    return { authorised: false, reason: reasons };

  }



  if (inputs.input.grandKingApproved !== true) {

    reasons.push("grandKingApproved must be explicitly true — never auto-approve");

    return { authorised: false, reason: reasons };

  }



  if (!inputs.prerequisites.allPrerequisitesMet) {

    reasons.push(...inputs.prerequisites.outstandingIssues);

    reasons.push("Prerequisites incomplete — deployment authorisation blocked even with approve decision");

    return { authorised: false, reason: reasons };

  }



  const pack = inputs.packCollection.packReport;

  if (!pack || pack.decision === "withhold" || pack.decision === "escalate") {

    reasons.push("Executive Acceptance Pack withhold/failed — deployment stays blocked");

    return { authorised: false, reason: reasons };

  }



  return { authorised: true, reason: ["Grand King approve + prerequisites satisfied + pack certified"] };

}



export function resolveDeploymentAuthorisationStatus(

  inputs: GateInputs,

  authorisationCheck: ReturnType<typeof canAuthoriseDeployment>,

): "authorised" | "blocked" | "revoked" | "pending" {

  if (inputs.explicitDecision === "reject") return "blocked";

  if (inputs.explicitDecision === "defer") return "blocked";

  if (inputs.explicitDecision === "pending") return "blocked";

  if (inputs.explicitDecision === "approve" && authorisationCheck.authorised) return "authorised";

  return "blocked";

}



export function resolveReReviewStatus(

  decision: GrandKingDecision,

  previousReReview: "not_required" | "requested" | "in_progress" | "completed",

  requestReReview: boolean,

): "not_required" | "requested" | "in_progress" | "completed" {

  if (requestReReview) return "requested";

  if (decision === "reject" || decision === "defer") return "requested";

  if (previousReReview === "requested" && decision === "approve") return "completed";

  if (previousReReview === "in_progress" && decision !== "pending") return "completed";

  return previousReReview === "completed" ? "completed" : "not_required";

}



export function computeConfidenceScore(

  prerequisites: PrerequisiteVerification,

  decision: GrandKingDecision,

): number {

  let score = 0;

  if (prerequisites.pccrtCertified) score += 0.2;

  if (prerequisites.packAuditCertified) score += 0.2;

  if (prerequisites.packCertSummaryComplete) score += 0.15;

  if (prerequisites.q1110ContractConsumed) score += 0.15;

  if (prerequisites.packDecisionCertify) score += 0.15;

  if (decision === "approve") score += 0.15;

  return Math.min(1, Math.round(score * 100) / 100);

}

