/**
 * G6-06 — Performance, scalability & resilience certification contract types.
 */

import { z } from "zod";
import type { PerformanceCertificationResultState } from "../../../../registry/types/certification-registry-types.js";
import { PERFORMANCE_CERTIFICATION_RESULT_STATES } from "../../../../registry/types/certification-registry-types.js";

export const PERFORMANCE_SCALABILITY_RESILIENCE_CERTIFICATION_VERSION = "g6-06-v1" as const;

export { PERFORMANCE_CERTIFICATION_RESULT_STATES as PERFORMANCE_RESULT_STATES };
export type PerformanceResultState = PerformanceCertificationResultState;

export const PERFORMANCE_EKLS_KINDS = [
  "performance_scan_completed",
  "performance_warning",
  "performance_failure",
  "performance_recovered",
  "performance_certified",
] as const;

export type PerformanceEklsKind = (typeof PERFORMANCE_EKLS_KINDS)[number];

export type PerformanceBottleneck = {
  bottleneckId: string;
  ruleId: string;
  ruleKind: string;
  performanceDomain: string;
  serviceId: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  message: string;
  recommendation?: string;
};

export type PerformanceBenchmarkEntry = {
  benchmarkId: string;
  performanceDomain: string;
  signalRef: string;
  withinTarget: boolean;
  summary: string;
};

export type PerformanceTrendEntry = {
  trendId: string;
  performanceDomain: string;
  direction: "stable" | "degrading" | "improving";
  summary: string;
};

export type PerformanceRiskEntry = {
  riskId: string;
  ruleId: string;
  performanceDomain: string;
  severity: PerformanceBottleneck["severity"];
  summary: string;
  mitigation?: string;
};

export type ScalabilityStatusSummary = {
  horizontalScaleReady: boolean;
  workflowThroughputReady: boolean;
  queueThroughputReady: boolean;
};

export type ResilienceStatusSummary = {
  failoverReady: boolean;
  recoverySuccess: boolean;
  recoverySpeedAcceptable: boolean;
};

export type PerformanceScanResult = {
  scanId: string;
  correlationId: string;
  status: PerformanceResultState;
  performanceScore: number;
  bottlenecks: PerformanceBottleneck[];
  warnings: PerformanceBottleneck[];
  benchmarks: PerformanceBenchmarkEntry[];
  trends: PerformanceTrendEntry[];
  riskRegister: PerformanceRiskEntry[];
  executiveRecommendations: string[];
  scalabilityStatus: ScalabilityStatusSummary;
  resilienceStatus: ResilienceStatusSummary;
  scannedAt: string;
  discoverySource: "REG-CERTIFICATION-PERFORMANCE";
};

export type PerformanceOverview = {
  frameworkVersion: typeof PERFORMANCE_SCALABILITY_RESILIENCE_CERTIFICATION_VERSION;
  ruleCount: number;
  performanceDomainCount: number;
  lastScanId?: string;
  lastStatus?: PerformanceResultState;
  generatedAt: string;
};

export const performancePluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  validatorKind: z.enum(["performance", "benchmark", "load_analyser", "resilience", "scalability"]),
  pillowGovernance: z.literal(true),
});

export type PerformancePluginManifest = z.infer<typeof performancePluginManifestSchema>;
