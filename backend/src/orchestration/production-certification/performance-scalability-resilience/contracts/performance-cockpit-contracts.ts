/**
 * G6-06 — Cockpit Performance backend contracts.
 */

import type {
  PerformanceBottleneck,
  PerformanceOverview,
  PerformanceResultState,
  PerformanceScanResult,
  PerformanceTrendEntry,
  ResilienceStatusSummary,
  ScalabilityStatusSummary,
} from "./performance-certification-types.js";

export const COCKPIT_PERFORMANCE_VIEW_ID = "cockpit-performance-scalability-resilience" as const;

export type CockpitPerformanceView = {
  viewId: typeof COCKPIT_PERFORMANCE_VIEW_ID;
  computedAt: string;
  dataMode: "live";
  performanceOverview: PerformanceOverview;
  scalabilityStatus: ScalabilityStatusSummary;
  resilienceStatus: ResilienceStatusSummary;
  bottlenecks: PerformanceBottleneck[];
  performanceTrends: PerformanceTrendEntry[];
  certificationStatus: PerformanceResultState;
  performanceScore: number;
  recommendations: string[];
  lastScan?: Pick<PerformanceScanResult, "scanId" | "status" | "performanceScore" | "scannedAt">;
  discoverySource: "production-certification:performance-scalability-resilience-cockpit";
};

export function buildCockpitPerformanceView(input: {
  overview: PerformanceOverview;
  scan?: PerformanceScanResult;
}): CockpitPerformanceView {
  const scan = input.scan;
  return {
    viewId: COCKPIT_PERFORMANCE_VIEW_ID,
    computedAt: new Date().toISOString(),
    dataMode: "live",
    performanceOverview: input.overview,
    scalabilityStatus: scan?.scalabilityStatus ?? {
      horizontalScaleReady: false,
      workflowThroughputReady: false,
      queueThroughputReady: false,
    },
    resilienceStatus: scan?.resilienceStatus ?? {
      failoverReady: false,
      recoverySuccess: false,
      recoverySpeedAcceptable: false,
    },
    bottlenecks: scan?.bottlenecks ?? [],
    performanceTrends: scan?.trends ?? [],
    certificationStatus: scan?.status ?? "warning",
    performanceScore: scan?.performanceScore ?? 0,
    recommendations: scan?.executiveRecommendations ?? [],
    lastScan: scan
      ? { scanId: scan.scanId, status: scan.status, performanceScore: scan.performanceScore, scannedAt: scan.scannedAt }
      : undefined,
    discoverySource: "production-certification:performance-scalability-resilience-cockpit",
  };
}
