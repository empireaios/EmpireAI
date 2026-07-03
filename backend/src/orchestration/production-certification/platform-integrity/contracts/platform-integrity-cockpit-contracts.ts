/**
 * G6-01 — Cockpit Platform Integrity backend contracts.
 */

import type {
  DependencyMatrixEntry,
  OwnershipMatrixEntry,
  PlatformIntegrityOverview,
  PlatformIntegrityResultState,
  PlatformIntegrityScanResult,
  PlatformIntegrityViolation,
} from "./platform-integrity-types.js";

export const COCKPIT_PLATFORM_INTEGRITY_VIEW_ID = "cockpit-platform-integrity" as const;

export type CockpitPlatformIntegrityView = {
  viewId: typeof COCKPIT_PLATFORM_INTEGRITY_VIEW_ID;
  computedAt: string;
  dataMode: "live";
  platformIntegrity: PlatformIntegrityOverview;
  architectureHealth: {
    status: PlatformIntegrityResultState;
    score: number;
    label: string;
  };
  ownershipMatrix: OwnershipMatrixEntry[];
  dependencyMatrix: DependencyMatrixEntry[];
  certificationStatus: PlatformIntegrityResultState;
  riskSummary: {
    violationCount: number;
    driftCount: number;
    duplicateOwnershipCount: number;
    circularDependencyCount: number;
    topRisks: PlatformIntegrityViolation[];
  };
  lastScan?: Pick<PlatformIntegrityScanResult, "scanId" | "status" | "score" | "scannedAt">;
  discoverySource: "production-certification:platform-integrity-cockpit";
};

export function buildCockpitPlatformIntegrityView(input: {
  overview: PlatformIntegrityOverview;
  scan?: PlatformIntegrityScanResult;
}): CockpitPlatformIntegrityView {
  const scan = input.scan;
  return {
    viewId: COCKPIT_PLATFORM_INTEGRITY_VIEW_ID,
    computedAt: new Date().toISOString(),
    dataMode: "live",
    platformIntegrity: input.overview,
    architectureHealth: {
      status: scan?.status ?? "warning",
      score: scan?.score ?? 0,
      label: scan ? `Architecture health ${scan.status}` : "No scan completed",
    },
    ownershipMatrix: scan?.ownershipMatrix ?? [],
    dependencyMatrix: scan?.dependencyMatrix ?? [],
    certificationStatus: scan?.status ?? "warning",
    riskSummary: {
      violationCount: scan?.violations.length ?? 0,
      driftCount: scan?.driftFindings.length ?? 0,
      duplicateOwnershipCount: scan?.duplicateOwnershipFindings.length ?? 0,
      circularDependencyCount: scan?.circularDependencyFindings.length ?? 0,
      topRisks: scan?.violations.slice(0, 5) ?? [],
    },
    lastScan: scan
      ? { scanId: scan.scanId, status: scan.status, score: scan.score, scannedAt: scan.scannedAt }
      : undefined,
    discoverySource: "production-certification:platform-integrity-cockpit",
  };
}
