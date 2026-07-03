/**
 * G7-10 — Grand King launch readiness evaluator.
 */

import { createGrandKingLiveOperationsModuleContract } from "../../contract/live-operations-module.js";
import type {
  FinalLiveLaunchBlocker,
  GrandKingLaunchReadinessSummary,
  ValidatedLiveDomainResult,
} from "../contracts/final-live-operations-certification-types.js";
import { G7_MISSION_AUDIT_REFS } from "../contracts/final-live-operations-certification-types.js";

export function evaluateGrandKingLaunchReadiness(input: {
  validatedDomains: ValidatedLiveDomainResult[];
  blockers: FinalLiveLaunchBlocker[];
  liveEligible: boolean;
  launchScore: number;
}): GrandKingLaunchReadinessSummary {
  const contract = createGrandKingLiveOperationsModuleContract();
  const programmeComplete =
    contract.missionId === "G7-10" &&
    contract.programmeStatus === "live-operations-version-1-certified";

  const missionRefsValidated = G7_MISSION_AUDIT_REFS.map((ref) => ref.missionId);
  const domainScores = input.validatedDomains.filter((d) => d.status === "pass" || d.status === "pass_with_conditions");
  const score = programmeComplete
    ? Math.round((domainScores.length / Math.max(input.validatedDomains.length, 1)) * 100)
    : Math.min(input.launchScore, 50);

  const blockers: FinalLiveLaunchBlocker[] = [...input.blockers];
  const conditions: string[] = [];

  if (!programmeComplete) {
    conditions.push("G7 programme module contract not at G7-10 live-operations-version-1-certified");
  }
  if (!input.liveEligible) {
    conditions.push("Live launch eligibility not confirmed");
  }
  if (process.env.LIVE_GRAND_KING_NOT_READY === "true") {
    blockers.push({
      blockerId: "grand-king-not-ready",
      domainId: "grand_king_readiness",
      domainLabel: "Grand King Readiness",
      severity: "critical",
      message: "Grand King readiness signal indicates not ready for Version 1 launch",
      recommendation: "Resolve Grand King readiness blockers before live launch",
      overrideEligible: false,
    });
  }

  const ready =
    programmeComplete &&
    input.liveEligible &&
    blockers.filter((b) => b.severity === "critical").length === 0 &&
    process.env.LIVE_GRAND_KING_NOT_READY !== "true";

  return {
    ready,
    score,
    blockers,
    conditions,
    programmeRefsValidated: missionRefsValidated,
  };
}
