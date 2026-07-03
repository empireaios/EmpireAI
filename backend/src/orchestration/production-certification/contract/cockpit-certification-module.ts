/**
 * G6-00 — Cockpit Certification Centre backend contracts (presentation deferred to G6-01+).
 */

import type {
  CertificationBlocker,
  CertificationOverview,
  CertificationResultState,
  CertificationRisk,
  CertificationRunResult,
} from "../contracts/production-certification-types.js";

export const COCKPIT_CERTIFICATION_MODULE_ID = "cockpit-certification-centre" as const;

export type CockpitCertificationCentreView = {
  viewId: typeof COCKPIT_CERTIFICATION_MODULE_ID;
  computedAt: string;
  dataMode: "live" | "sandbox";
  overview: CertificationOverview;
  overallStatus: CertificationResultState;
  productionEligible: boolean;
  blockerCount: number;
  riskCount: number;
  lastRun?: Pick<
    CertificationRunResult,
    "runId" | "overallStatus" | "overallScore" | "productionEligible" | "completedAt"
  >;
  blockers: CertificationBlocker[];
  risks: CertificationRisk[];
  discoverySource: "production-certification:cockpit-backend-contract";
};

export type CockpitCertificationRouteRegistration = {
  routeId: "cockpit.certification.centre";
  moduleId: typeof COCKPIT_CERTIFICATION_MODULE_ID;
  presentationDeferred: true;
  backendContractOnly: true;
  futureMission: "G6-01+";
};

export function createCockpitCertificationRouteRegistration(): CockpitCertificationRouteRegistration {
  return {
    routeId: "cockpit.certification.centre",
    moduleId: COCKPIT_CERTIFICATION_MODULE_ID,
    presentationDeferred: true,
    backendContractOnly: true,
    futureMission: "G6-01+",
  };
}

export function buildCockpitCertificationCentreView(input: {
  overview: CertificationOverview;
  lastRun?: CertificationRunResult;
  blockers: CertificationBlocker[];
  risks: CertificationRisk[];
}): CockpitCertificationCentreView {
  return {
    viewId: COCKPIT_CERTIFICATION_MODULE_ID,
    computedAt: new Date().toISOString(),
    dataMode: "live",
    overview: input.overview,
    overallStatus: input.lastRun?.overallStatus ?? "unknown",
    productionEligible: input.lastRun?.productionEligible ?? false,
    blockerCount: input.blockers.length,
    riskCount: input.risks.length,
    lastRun: input.lastRun
      ? {
          runId: input.lastRun.runId,
          overallStatus: input.lastRun.overallStatus,
          overallScore: input.lastRun.overallScore,
          productionEligible: input.lastRun.productionEligible,
          completedAt: input.lastRun.completedAt,
        }
      : undefined,
    blockers: input.blockers,
    risks: input.risks,
    discoverySource: "production-certification:cockpit-backend-contract",
  };
}
