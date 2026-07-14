/** PILLOW-BR-001 — Brain Runtime types (P5-01). */

import type { RUNTIME_GOVERNANCE_DOMAINS, RUNTIME_PRINCIPLES } from "./paths.js";

export type RuntimeGovernanceDomain = (typeof RUNTIME_GOVERNANCE_DOMAINS)[number];
export type RuntimePrinciple = (typeof RUNTIME_PRINCIPLES)[number];
export type RuntimeHealthStatus = "healthy" | "degraded" | "blocked";

export interface BrainRuntimeState {
  engineVersion: "PILLOW-BR-001";
  status: "ready" | "degraded" | "blocked";
  initializedAt: string;
  doctrinePath: string;
  companionPath: string;
  lastAssessment: RuntimeAssessmentResult | null;
}

export interface BrainRuntimeRequest {
  missionId?: string | null;
  missionTitle?: string | null;
  roadmapItem?: string | null;
  grandKingOverride?: boolean;
}

export interface BrainRuntimeBuilderGateResult {
  allowed: boolean;
  reason: string;
  overrideApplied: boolean;
  readinessScore: number;
  pipeline: RuntimeReadinessPipeline;
}

export interface RuntimeReadinessPipeline {
  pipelineVersion: "P5-01";
  success: boolean;
  readinessScore: number;
  doctrinePresent: boolean;
  architectureAligned: boolean;
  bottleneckRegistryComplete: boolean;
  runtimeAssessmentReady: boolean;
  recommendedAction: string;
  steps: Array<{ label: string; status: string; summary: string }>;
}

/** Live runtime snapshot — injected from backend bridge. */
export interface BrainRuntimeSnapshot {
  capturedAt: string;
  eventLoopLagMs: number;
  heapUsedMb: number;
  heapTotalMb: number;
  rssMb: number;
  redisMode: "connected" | "degraded" | "unknown";
  queueDepth: number;
  workersActive: boolean;
  sqliteHealthy: boolean;
  apiHealthy: boolean;
  pillowResponsive: boolean;
  loginResponsive: boolean;
  executiveHomeResponsive: boolean;
  brainResponsive: boolean;
}

export interface RuntimeBottleneck {
  id: string;
  category: RuntimeGovernanceDomain;
  severity: "critical" | "high" | "medium" | "low";
  location: string;
  description: string;
  mitigation: string;
  blocking: boolean;
}

export interface RuntimeDomainHealth {
  domain: RuntimeGovernanceDomain;
  status: RuntimeHealthStatus;
  detail: string;
}

export interface RuntimeAssessmentResult {
  pipelineVersion: "P5-01";
  assessedAt: string;
  overallStatus: RuntimeHealthStatus;
  responsive: boolean;
  domains: RuntimeDomainHealth[];
  bottlenecks: RuntimeBottleneck[];
  activeBottlenecks: RuntimeBottleneck[];
  snapshot: BrainRuntimeSnapshot | null;
  principles: Array<{ principle: RuntimePrinciple; satisfied: boolean; detail: string }>;
  success: boolean;
  summary: string;
}

export interface BrainRuntimeMetrics {
  eventLoopLagMs: number;
  memoryPressure: number;
  queueDepth: number;
  activeBottleneckCount: number;
  responsivenessScore: number;
  trend: "improving" | "stable" | "degrading";
}

export interface BrainRuntimeAnalysis {
  stabilityTrend: string[];
  performanceTrends: string[];
  runtimeDrift: string[];
  architectureDrift: string[];
  productionDrift: string[];
  recommendations: string[];
}
