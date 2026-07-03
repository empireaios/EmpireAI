/**
 * G7-00 — Production eligibility gate (G6 certification required before live operations).
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { createProductionCertificationModuleContract } from "../../production-certification/contract/production-certification-module.js";
import {
  getLastFinalProductionReadinessRun,
  getProductionEligibilitySummary,
} from "../../production-certification/final-production-readiness/services/final-production-readiness-service.js";

export type ProductionEligibilityGateResult = {
  eligible: boolean;
  reason: string;
  certificationReference: string;
  readinessReference: string;
};

export function validateProductionEligibilityGate(
  context: RegistryLoaderContext = {},
): ProductionEligibilityGateResult {
  if (process.env.LIVE_OPS_PRODUCTION_NOT_ELIGIBLE === "true") {
    return {
      eligible: false,
      reason: "Production eligibility blocked by governance signal",
      certificationReference: "none",
      readinessReference: "policy:g6-production-readiness-gate",
    };
  }

  const run = getLastFinalProductionReadinessRun();
  const eligibility = getProductionEligibilitySummary(context);
  const moduleContract = createProductionCertificationModuleContract();
  const programmeCertified =
    moduleContract.missionId === "G6-10" &&
    moduleContract.programmeStatus === "production-readiness-certified";

  if (!run) {
    if (programmeCertified) {
      return {
        eligible: true,
        reason: "G6 programme certified at G6-10 — live operations permitted",
        certificationReference: "G6-10:production-readiness-certified",
        readinessReference: "policy:g6-production-readiness-gate",
      };
    }
    return {
      eligible: false,
      reason: "G6 final production readiness certification not completed",
      certificationReference: "none",
      readinessReference: "policy:g6-production-readiness-gate",
    };
  }

  const outcome = run.record.certificationStatus;
  const eligibleOutcomes = ["PRODUCTION_READY", "PRODUCTION_READY_WITH_CONDITIONS"];
  if (eligibleOutcomes.includes(outcome)) {
    return {
      eligible: true,
      reason: "G6 production readiness confirmed — live operations permitted",
      certificationReference: run.runId,
      readinessReference: run.record.correlationId,
    };
  }

  if (programmeCertified && outcome === "UNKNOWN" && eligibility.certificationStatus !== "BLOCKED") {
    return {
      eligible: true,
      reason: "G6 programme certified — live operations permitted with registry-driven readiness",
      certificationReference: run.runId,
      readinessReference: run.record.correlationId,
    };
  }

  return {
    eligible: false,
    reason: `Production not eligible: ${outcome}`,
    certificationReference: run.runId,
    readinessReference: run.record.correlationId,
  };
}
