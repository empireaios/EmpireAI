/** PILLOW-PG-001 — Performance Governance types (P5-06). */

import type {
  PERFORMANCE_DOMAINS,
  PERFORMANCE_METRICS,
  PERFORMANCE_PRINCIPLES,
  PHASE_P5_MISSIONS,
  REGRESSION_SEVERITIES,
} from "./paths.js";

export type PerformanceDomain = (typeof PERFORMANCE_DOMAINS)[number];
export type PerformanceMetric = (typeof PERFORMANCE_METRICS)[number];
export type PerformancePrinciple = (typeof PERFORMANCE_PRINCIPLES)[number];
export type RegressionSeverity = (typeof REGRESSION_SEVERITIES)[number];
export type PhaseP5Mission = (typeof PHASE_P5_MISSIONS)[number];

export interface PerformanceGovernanceState {
  engineVersion: "PILLOW-PG-001";
  status: "ready" | "degraded" | "blocked";
  initializedAt: string;
  doctrinePath: string;
  companionPath: string;
  lastAssessment: PerformanceGovernanceAssessment | null;
}

export interface PerformanceGovernanceRequest {
  missionId?: string | null;
  missionTitle?: string | null;
  roadmapItem?: string | null;
  grandKingOverride?: boolean;
}

export interface PerformanceGovernanceBuilderGateResult {
  allowed: boolean;
  reason: string;
  overrideApplied: boolean;
  readinessScore: number;
  pipeline: PerformanceGovernanceReadinessPipeline;
}

export interface PerformanceGovernanceReadinessPipeline {
  pipelineVersion: "P5-06";
  success: boolean;
  readinessScore: number;
  doctrinePresent: boolean;
  baselinesDocumented: boolean;
  metricsRegistryComplete: boolean;
  regressionDetectionReady: boolean;
  phaseP5ReviewComplete: boolean;
  recommendedAction: string;
  steps: Array<{ label: string; status: string; summary: string }>;
}

export interface PerformanceBaselineRecord {
  id: string;
  surface: string;
  domain: PerformanceDomain;
  currentPerformance: string;
  targetPerformance: string;
  acceptableThreshold: string;
  criticalThreshold: string;
}

export interface PerformanceMetricRecord {
  id: PerformanceMetric;
  label: string;
  domain: PerformanceDomain;
  unit: string;
  description: string;
}

export interface PerformanceRegressionRecord {
  id: string;
  signal: string;
  severity: RegressionSeverity;
  description: string;
  detectionMethod: string;
}

export interface PerformanceBottleneckRecord {
  id: string;
  domain: PerformanceDomain;
  severity: RegressionSeverity;
  description: string;
  source: string;
}

export interface PhaseP5ReviewRecord {
  missionId: PhaseP5Mission;
  name: string;
  status: "complete" | "partial" | "gap";
  runtimeModule: string;
  findings: string[];
  severity: RegressionSeverity;
}

export interface PerformanceGovernanceSnapshot {
  capturedAt: string;
  nodeEnv: string;
  eventLoopLagMs: number;
  heapUsedMb: number;
  heapTotalMb: number;
  rssMb: number;
  apiResponseTimeMs: number;
  redisLatencyMs: number;
  queueDepth: number;
  queueLatencyMs: number;
  databaseQueryTimeMs: number;
  workerExecutionTimeMs: number;
  missionDurationMs: number;
  aiProviderLatencyMs: number;
  memoryUsagePercent: number;
  cpuUsagePercent: number;
  productionAvailabilityPercent: number;
  pillowHostSessions: number;
  overallPerformanceScore: number;
}

export interface PerformanceGovernanceAssessment {
  pipelineVersion: "P5-06";
  assessedAt: string;
  overallPerformanceScore: number;
  performanceGrade: "excellent" | "good" | "acceptable" | "degraded" | "critical";
  baselines: PerformanceBaselineRecord[];
  metrics: PerformanceMetricRecord[];
  regressions: PerformanceRegressionRecord[];
  bottlenecks: PerformanceBottleneckRecord[];
  phaseP5Review: PhaseP5ReviewRecord[];
  snapshot: PerformanceGovernanceSnapshot | null;
  success: boolean;
  summary: string;
  grandKingSummary: string;
}

export interface PerformanceGovernanceMetrics {
  totalDomains: number;
  totalMetrics: number;
  baselineCount: number;
  bottleneckCount: number;
  criticalBottlenecks: number;
  regressionCount: number;
  readinessScore: number;
  overallPerformanceScore: number;
  trend: "improving" | "stable" | "degrading";
}

export interface PerformanceGovernanceAnalysis {
  performanceTrends: string[];
  performanceRegressions: string[];
  performanceOpportunities: string[];
  architectureBottlenecks: string[];
  engineeringBottlenecks: string[];
  businessBottlenecks: string[];
  recommendations: string[];
}
