/** PILLOW-SCL-001 — Scaling Architecture types (P5-05). */

import type {
  SCALING_DOMAINS,
  SCALING_PRINCIPLES,
  SCALING_STAGES,
  STAGE_DOCUMENTATION_FIELDS,
} from "./paths.js";

export type ScalingDomain = (typeof SCALING_DOMAINS)[number];
export type ScalingStage = (typeof SCALING_STAGES)[number];
export type ScalingPrinciple = (typeof SCALING_PRINCIPLES)[number];
export type StageDocField = (typeof STAGE_DOCUMENTATION_FIELDS)[number];

export interface ScalingArchitectureState {
  engineVersion: "PILLOW-SCL-001";
  status: "ready" | "degraded" | "blocked";
  initializedAt: string;
  doctrinePath: string;
  companionPath: string;
  lastAssessment: ScalingArchitectureAssessment | null;
}

export interface ScalingArchitectureRequest {
  missionId?: string | null;
  missionTitle?: string | null;
  roadmapItem?: string | null;
  grandKingOverride?: boolean;
}

export interface ScalingArchitectureBuilderGateResult {
  allowed: boolean;
  reason: string;
  overrideApplied: boolean;
  readinessScore: number;
  pipeline: ScalingArchitectureReadinessPipeline;
}

export interface ScalingArchitectureReadinessPipeline {
  pipelineVersion: "P5-05";
  success: boolean;
  readinessScore: number;
  doctrinePresent: boolean;
  currentArchitectureDocumented: boolean;
  scalingRoadmapComplete: boolean;
  migrationStrategyDocumented: boolean;
  recommendedAction: string;
  steps: Array<{ label: string; status: string; summary: string }>;
}

export interface CurrentArchitectureRecord {
  id: string;
  domain: ScalingDomain;
  name: string;
  topology: string;
  limitation: string;
  owner: string;
}

export interface ScalingStageRecord {
  id: ScalingStage;
  stageNumber: number;
  name: string;
  objectives: string[];
  dependencies: string[];
  exitCriteria: string[];
  currentLimitations: string[];
  targetCapabilities: string[];
  migrationNotes: string;
}

export interface DatabaseEvolutionRecord {
  phase: string;
  description: string;
  status: "current" | "planned" | "future";
  dependencies: string[];
}

export interface RuntimeEvolutionRecord {
  area: string;
  currentState: string;
  targetState: string;
  scalingTrigger: string;
}

export interface ScalingBottleneckRecord {
  id: string;
  domain: ScalingDomain;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  scalingImpact: string;
  resolutionStage: ScalingStage;
}

export interface ScalingArchitectureSnapshot {
  capturedAt: string;
  nodeEnv: string;
  currentStage: ScalingStage;
  redisConnected: boolean;
  workersActive: boolean;
  sqliteOnly: boolean;
  singleInstance: boolean;
  eventLoopLagMs: number;
  heapUsedMb: number;
  queueDepth: number;
  pillowHostSessions: number;
  scalingReadinessScore: number;
}

export interface ScalingArchitectureAssessment {
  pipelineVersion: "P5-05";
  assessedAt: string;
  currentStage: ScalingStage;
  recommendedNextStage: ScalingStage;
  scalingReadiness: "ready" | "limited" | "not_ready";
  currentArchitecture: CurrentArchitectureRecord[];
  scalingStages: ScalingStageRecord[];
  databaseEvolution: DatabaseEvolutionRecord[];
  runtimeEvolution: RuntimeEvolutionRecord[];
  bottlenecks: ScalingBottleneckRecord[];
  snapshot: ScalingArchitectureSnapshot | null;
  success: boolean;
  summary: string;
  grandKingSummary: string;
}

export interface ScalingArchitectureMetrics {
  totalDomains: number;
  currentStageNumber: number;
  bottleneckCount: number;
  criticalBottlenecks: number;
  readinessScore: number;
  exitCriteriaMet: number;
  exitCriteriaTotal: number;
  trend: "improving" | "stable" | "degrading";
}

export interface ScalingArchitectureAnalysis {
  scalingReadiness: string[];
  infrastructureBottlenecks: string[];
  runtimeBottlenecks: string[];
  growthTrends: string[];
  architectureReadiness: string[];
  recommendations: string[];
}
