/**
 * G6-05 — Cockpit Business Operations backend contracts.
 */

import type {
  BusinessDependencyEntry,
  BusinessFinding,
  BusinessOperationsOverview,
  BusinessOperationsResultState,
  BusinessOperationsScanResult,
  BusinessRiskEntry,
  CommerceHealthSummary,
} from "./business-operations-types.js";

export const COCKPIT_BUSINESS_OPERATIONS_VIEW_ID = "cockpit-business-operations" as const;

export type CockpitBusinessOperationsView = {
  viewId: typeof COCKPIT_BUSINESS_OPERATIONS_VIEW_ID;
  computedAt: string;
  dataMode: "live";
  businessOperationsOverview: BusinessOperationsOverview;
  businessReadiness: {
    status: BusinessOperationsResultState;
    executiveScore: number;
    label: string;
  };
  commerceHealth: CommerceHealthSummary;
  businessRisks: BusinessRiskEntry[];
  executiveScore: number;
  certificationStatus: BusinessOperationsResultState;
  recommendations: string[];
  dependencies: BusinessDependencyEntry[];
  failures: BusinessFinding[];
  lastScan?: Pick<BusinessOperationsScanResult, "scanId" | "status" | "executiveScore" | "scannedAt">;
  discoverySource: "production-certification:business-operations-cockpit";
};

export function buildCockpitBusinessOperationsView(input: {
  overview: BusinessOperationsOverview;
  scan?: BusinessOperationsScanResult;
}): CockpitBusinessOperationsView {
  const scan = input.scan;
  return {
    viewId: COCKPIT_BUSINESS_OPERATIONS_VIEW_ID,
    computedAt: new Date().toISOString(),
    dataMode: "live",
    businessOperationsOverview: input.overview,
    businessReadiness: {
      status: scan?.status ?? "warning",
      executiveScore: scan?.executiveScore ?? 0,
      label: scan ? `Executive business score ${scan.executiveScore} (${scan.status})` : "No scan completed",
    },
    commerceHealth: scan?.commerceHealth ?? {
      marketplaceReady: false,
      supplierReady: false,
      storefrontReady: false,
      paymentReady: false,
      logisticsReady: false,
    },
    businessRisks: scan?.riskRegister ?? [],
    executiveScore: scan?.executiveScore ?? 0,
    certificationStatus: scan?.status ?? "warning",
    recommendations: scan?.executiveRecommendations ?? [],
    dependencies: scan?.dependencies ?? [],
    failures: scan?.failures ?? [],
    lastScan: scan
      ? { scanId: scan.scanId, status: scan.status, executiveScore: scan.executiveScore, scannedAt: scan.scannedAt }
      : undefined,
    discoverySource: "production-certification:business-operations-cockpit",
  };
}
