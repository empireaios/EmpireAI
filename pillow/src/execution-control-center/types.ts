/** PILLOW-ECC-001 — Execution Control Center types (P6-01). */

import type {
  ECC_COORDINATED_SYSTEMS,
  ECC_DEPENDENCY_CATEGORIES,
  ECC_EXECUTION_PIPELINE,
  ECC_EXECUTION_STATES,
  ECC_PRINCIPLES,
  ECC_RESOURCE_CATEGORIES,
  ECC_RESPONSIBILITIES,
} from "./paths.js";

export type EccPrinciple = (typeof ECC_PRINCIPLES)[number];
export type EccResponsibility = (typeof ECC_RESPONSIBILITIES)[number];
export type EccCoordinatedSystem = (typeof ECC_COORDINATED_SYSTEMS)[number];
export type EccExecutionState = (typeof ECC_EXECUTION_STATES)[number];
export type EccPipelineStage = (typeof ECC_EXECUTION_PIPELINE)[number];
export type EccDependencyCategory = (typeof ECC_DEPENDENCY_CATEGORIES)[number];
export type EccResourceCategory = (typeof ECC_RESOURCE_CATEGORIES)[number];

export interface ExecutionControlCenterState {
  engineVersion: "PILLOW-ECC-001";
  status: "ready" | "degraded" | "blocked";
  initializedAt: string;
  doctrinePath: string;
  companionPath: string;
  surfacesAttached: boolean;
  lastAssessment: ExecutionControlAssessment | null;
}

export interface ExecutionControlCenterRequest {
  missionId?: string | null;
  missionTitle?: string | null;
  roadmapItem?: string | null;
  grandKingOverride?: boolean;
}

export interface ExecutionControlBuilderGateResult {
  allowed: boolean;
  reason: string;
  overrideApplied: boolean;
  readinessScore: number;
  pipeline: ExecutionControlReadinessPipeline;
}

export interface ExecutionControlReadinessPipeline {
  pipelineVersion: "P6-01";
  success: boolean;
  readinessScore: number;
  doctrinePresent: boolean;
  pipelineDocumented: boolean;
  statesDocumented: boolean;
  dependenciesDocumented: boolean;
  resourcesDocumented: boolean;
  recommendedAction: string;
  steps: Array<{ label: string; status: string; summary: string }>;
}

export interface ExecutionPipelineStageRecord {
  stage: EccPipelineStage;
  order: number;
  owner: string;
  description: string;
}

export interface ExecutionDependencyRecord {
  id: string;
  category: EccDependencyCategory;
  name: string;
  description: string;
  criticalPath: boolean;
}

export interface ExecutionResourceRecord {
  id: string;
  category: EccResourceCategory;
  name: string;
  currentCapacity: string;
  coordinationRule: string;
}

export interface ExecutionQueueEntry {
  missionId: string;
  title: string;
  state: EccExecutionState;
  priority: number;
  dependencies: string[];
  progressPercent: number;
}

export interface ExecutionControlSnapshot {
  capturedAt: string;
  nodeEnv: string;
  activeMissionId: string | null;
  activeMissionTitle: string | null;
  executionState: EccExecutionState;
  currentPipelineStage: EccPipelineStage;
  queueDepth: number;
  overallProgressPercent: number;
  queuedMissions: number;
  activeDependencies: number;
  criticalPathLength: number;
  builderCapacity: "available" | "busy" | "blocked";
  runtimeCapacity: "healthy" | "degraded" | "critical";
  openRisks: number;
  openBottlenecks: number;
  coordinationScore: number;
}

export interface ExecutionControlAssessment {
  pipelineVersion: "P6-01";
  assessedAt: string;
  coordinationScore: number;
  executionGrade: "coordinated" | "partial" | "blocked";
  pipeline: ExecutionPipelineStageRecord[];
  dependencies: ExecutionDependencyRecord[];
  resources: ExecutionResourceRecord[];
  queue: ExecutionQueueEntry[];
  snapshot: ExecutionControlSnapshot | null;
  success: boolean;
  summary: string;
  grandKingSummary: string;
}

export interface ExecutionControlMetrics {
  totalResponsibilities: number;
  coordinatedSystems: number;
  pipelineStages: number;
  executionStates: number;
  queueDepth: number;
  readinessScore: number;
  coordinationScore: number;
  trend: "improving" | "stable" | "degrading";
}

export interface ExecutionControlAnalysis {
  executionTrends: string[];
  currentRisks: string[];
  currentBottlenecks: string[];
  dependencyStatus: string[];
  resourceStatus: string[];
  recommendations: string[];
}

export interface ExecutionCoordinationResult {
  allowed: boolean;
  reason: string;
  executionState: EccExecutionState;
  pipelineStage: EccPipelineStage;
  priority: number;
  dependenciesResolved: boolean;
  criticalPath: string[];
}
