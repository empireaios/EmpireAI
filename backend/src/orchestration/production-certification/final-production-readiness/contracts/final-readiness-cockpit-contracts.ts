/**
 * G6-10 — Cockpit final production readiness backend contracts.
 */

import type {
  FinalCertificationOutcome,
  FinalProductionReadinessOverview,
  FinalProductionReadinessRecord,
  FinalProductionReadinessRunResult,
  FinalReadinessBlocker,
  FinalReadinessEvidence,
  FinalReadinessRisk,
  GrandKingReadinessSummary,
} from "./final-production-readiness-types.js";

export const COCKPIT_FINAL_PRODUCTION_READINESS_VIEW_ID = "cockpit-final-production-readiness" as const;

export type CockpitFinalProductionReadinessView = {
  viewId: typeof COCKPIT_FINAL_PRODUCTION_READINESS_VIEW_ID;
  computedAt: string;
  dataMode: "certification";
  finalCertificationStatus: FinalCertificationOutcome;
  productionEligibility: boolean;
  blockers: FinalReadinessBlocker[];
  conditions: string[];
  riskRegister: FinalReadinessRisk[];
  grandKingReadiness: GrandKingReadinessSummary;
  recommendedActions: string[];
  certificationEvidence: FinalReadinessEvidence[];
  overview: FinalProductionReadinessOverview;
  lastRun?: Pick<FinalProductionReadinessRunResult, "runId" | "readinessScore" | "scannedAt">;
  discoverySource: "production-certification:final-readiness-cockpit";
};

export function buildCockpitFinalProductionReadinessView(input: {
  overview: FinalProductionReadinessOverview;
  run?: FinalProductionReadinessRunResult;
}): CockpitFinalProductionReadinessView {
  const record: FinalProductionReadinessRecord | undefined = input.run?.record;
  return {
    viewId: COCKPIT_FINAL_PRODUCTION_READINESS_VIEW_ID,
    computedAt: new Date().toISOString(),
    dataMode: "certification",
    finalCertificationStatus: record?.certificationStatus ?? "UNKNOWN",
    productionEligibility: record?.productionEligibility ?? false,
    blockers: record?.blockers ?? [],
    conditions: record?.conditions ?? [],
    riskRegister: record?.risks ?? [],
    grandKingReadiness: record?.grandKingReadiness ?? {
      ready: false,
      score: 0,
      blockers: [],
      conditions: [],
      programmeRefsValidated: [],
    },
    recommendedActions: record?.recommendations ?? [],
    certificationEvidence: record?.evidence ?? [],
    overview: input.overview,
    lastRun: input.run
      ? { runId: input.run.runId, readinessScore: input.run.readinessScore, scannedAt: input.run.scannedAt }
      : undefined,
    discoverySource: "production-certification:final-readiness-cockpit",
  };
}
