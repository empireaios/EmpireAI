import { assessProductionReadiness } from "../../revenue/first-revenue-validation/services/production-readiness-assessor.js";
import {
  assessVersion1OperationalActivation,
  type Version1ActivationAssessment,
} from "./version-1-activation-config.js";

export type Version1ProductionReadinessReview = {
  reviewId: string;
  reviewedAt: string;
  certificationMode: "ACTIVE";
  blockersAddressed: ["B5", "B6"];
  milestones: ["M1", "M2", "M3", "M4", "M5"];
  /** M1 — Version 1 scoped operational readiness (Amazon + CJ path). */
  operationalActivation: Version1ActivationAssessment;
  /** Broader first-revenue gates — informational; not all required for M1–M3. */
  extendedRevenueReadiness: ReturnType<typeof assessProductionReadiness>;
  /** M1 pass — operational activation blockers only. */
  productionReadinessPassed: boolean;
  findingsPreventingOperation: string[];
  informationalWarnings: string[];
};

/** M1 — Complete Production Readiness Review scoped to Version 1 operational activation. */
export function runVersion1ProductionReadinessReview(
  env: NodeJS.ProcessEnv = process.env,
): Version1ProductionReadinessReview {
  const operationalActivation = assessVersion1OperationalActivation(env);
  const extendedRevenueReadiness = assessProductionReadiness(env);

  const findingsPreventingOperation = [...operationalActivation.blockers];
  const informationalWarnings = [
    ...operationalActivation.warnings,
    ...extendedRevenueReadiness.warnings.map((w) => `[extended] ${w}`),
  ];

  return {
    reviewId: `v1-pr-${Date.now()}`,
    reviewedAt: new Date().toISOString(),
    certificationMode: "ACTIVE",
    blockersAddressed: ["B5", "B6"],
    milestones: ["M1", "M2", "M3", "M4", "M5"],
    operationalActivation,
    extendedRevenueReadiness,
    productionReadinessPassed: operationalActivation.ready,
    findingsPreventingOperation,
    informationalWarnings,
  };
}
