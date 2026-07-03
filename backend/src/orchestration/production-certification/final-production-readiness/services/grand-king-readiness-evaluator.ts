/**
 * G6-10 — Grand King readiness evaluator.
 */

import { createProductionCertificationModuleContract } from "../../contract/production-certification-module.js";
import type {
  FinalReadinessBlocker,
  GrandKingReadinessSummary,
  ValidatedDomainResult,
} from "../contracts/final-production-readiness-types.js";
import { G6_MISSION_AUDIT_REFS } from "../contracts/final-production-readiness-types.js";

export function evaluateGrandKingReadiness(input: {
  validatedDomains: ValidatedDomainResult[];
  blockers: FinalReadinessBlocker[];
  productionEligible: boolean;
  readinessScore: number;
}): GrandKingReadinessSummary {
  const contract = createProductionCertificationModuleContract();
  const programmeComplete =
    contract.missionId === "G6-10" &&
    contract.programmeStatus === "production-readiness-certified";

  const missionRefsValidated = G6_MISSION_AUDIT_REFS.map((ref) => ref.missionId);
  const domainScores = input.validatedDomains.filter((d) => d.status === "pass" || d.status === "pass_with_conditions");
  const score = programmeComplete
    ? Math.round((domainScores.length / Math.max(input.validatedDomains.length, 1)) * 100)
    : Math.min(input.readinessScore, 50);

  const blockers: FinalReadinessBlocker[] = [...input.blockers];
  const conditions: string[] = [];

  if (!programmeComplete) {
    conditions.push("G6 programme module contract not at G6-10 production-readiness-certified");
  }
  if (!input.productionEligible) {
    conditions.push("Production eligibility not confirmed");
  }
  if (process.env.FINAL_GRAND_KING_NOT_READY === "true") {
    blockers.push({
      blockerId: "grand-king-not-ready",
      domainId: "grand_king_readiness",
      domainLabel: "Grand King Readiness",
      severity: "critical",
      message: "Grand King readiness signal indicates not ready for G7",
      recommendation: "Resolve Grand King readiness blockers before G7 live operations",
      overrideEligible: false,
    });
  }

  const ready =
    programmeComplete &&
    input.productionEligible &&
    blockers.filter((b) => b.severity === "critical").length === 0 &&
    process.env.FINAL_GRAND_KING_NOT_READY !== "true";

  return {
    ready,
    score,
    blockers,
    conditions,
    programmeRefsValidated: missionRefsValidated,
  };
}
