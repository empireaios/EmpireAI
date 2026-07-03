/**
 * G6-04 — Cockpit Operational Readiness backend contracts.
 */

import type {
  OperationalBlocker,
  OperationalDependencyEntry,
  OperationalReadinessOverview,
  OperationalReadinessResultState,
  OperationalReadinessScanResult,
  OperationalRiskEntry,
} from "./operational-readiness-types.js";

export const COCKPIT_OPERATIONAL_READINESS_VIEW_ID = "cockpit-operational-readiness" as const;

export type CockpitOperationalReadinessView = {
  viewId: typeof COCKPIT_OPERATIONAL_READINESS_VIEW_ID;
  computedAt: string;
  dataMode: "live";
  operationalReadiness: OperationalReadinessOverview;
  operationalScore: {
    status: OperationalReadinessResultState;
    score: number;
    label: string;
  };
  operationalDependencies: OperationalDependencyEntry[];
  operationalBlockers: OperationalBlocker[];
  riskRegister: OperationalRiskEntry[];
  certificationStatus: OperationalReadinessResultState;
  executiveRecommendations: string[];
  lastScan?: Pick<OperationalReadinessScanResult, "scanId" | "status" | "score" | "scannedAt">;
  discoverySource: "production-certification:operational-readiness-cockpit";
};

export function buildCockpitOperationalReadinessView(input: {
  overview: OperationalReadinessOverview;
  scan?: OperationalReadinessScanResult;
}): CockpitOperationalReadinessView {
  const scan = input.scan;
  return {
    viewId: COCKPIT_OPERATIONAL_READINESS_VIEW_ID,
    computedAt: new Date().toISOString(),
    dataMode: "live",
    operationalReadiness: input.overview,
    operationalScore: {
      status: scan?.status ?? "warning",
      score: scan?.score ?? 0,
      label: scan ? `Operational score ${scan.score} (${scan.status})` : "No scan completed",
    },
    operationalDependencies: scan?.dependencies ?? [],
    operationalBlockers: scan?.blockers ?? [],
    riskRegister: scan?.riskRegister ?? [],
    certificationStatus: scan?.status ?? "warning",
    executiveRecommendations: scan?.executiveRecommendations ?? [],
    lastScan: scan
      ? { scanId: scan.scanId, status: scan.status, score: scan.score, scannedAt: scan.scannedAt }
      : undefined,
    discoverySource: "production-certification:operational-readiness-cockpit",
  };
}
