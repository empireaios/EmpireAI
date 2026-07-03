/**
 * G6-10 — Production eligibility engine.
 */

import type { CertificationResultState } from "../../contracts/production-certification-types.js";
import type { FinalReadinessBlocker, ValidatedDomainResult } from "../contracts/final-production-readiness-types.js";

const ELIGIBLE_STATUSES: CertificationResultState[] = ["pass", "pass_with_conditions", "not_applicable"];

export function evaluateProductionEligibility(input: {
  validatedDomains: ValidatedDomainResult[];
  blockers: FinalReadinessBlocker[];
}): { eligible: boolean; conditions: string[]; requiredActions: string[] } {
  if (process.env.FINAL_PRODUCTION_BLOCKED === "true") {
    return {
      eligible: false,
      conditions: ["Production eligibility blocked by governance signal"],
      requiredActions: ["Resolve FINAL_PRODUCTION_BLOCKED governance signal"],
    };
  }

  const criticalBlockers = input.blockers.filter((b) => b.severity === "critical");
  if (criticalBlockers.length > 0) {
    return {
      eligible: false,
      conditions: criticalBlockers.map((b) => b.message),
      requiredActions: criticalBlockers.map((b) => b.recommendation ?? `Resolve blocker ${b.blockerId}`),
    };
  }

  const failedDomains = input.validatedDomains.filter(
    (domain) => domain.status === "fail" || domain.status === "blocked",
  );
  if (failedDomains.length > 0) {
    return {
      eligible: false,
      conditions: failedDomains.map((d) => `${d.domainLabel} certification failed`),
      requiredActions: failedDomains.map((d) => `Re-run ${d.missionRef} certification scan`),
    };
  }

  const conditionalDomains = input.validatedDomains.filter(
    (domain) => !ELIGIBLE_STATUSES.includes(domain.status),
  );
  const conditions = conditionalDomains.map((d) => `${d.domainLabel} status: ${d.status}`);

  return {
    eligible: true,
    conditions,
    requiredActions: conditions.length > 0 ? ["Review conditional domain certifications before G7"] : [],
  };
}
