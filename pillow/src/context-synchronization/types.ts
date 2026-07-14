/** PILLOW-CS-001 — Context Synchronization System types (P4-03). */

import type { VisionSyncPipelineResult } from "../vision-synchronization/types.js";

export type ContextStepId =
  | "vision"
  | "vision_accumulation"
  | "soul"
  | "constitution"
  | "roadmap"
  | "current_roadmap_item"
  | "hierarchy"
  | "canonical_architecture"
  | "canonical_documentation"
  | "repository_structure"
  | "production_truth"
  | "current_production_state"
  | "journey"
  | "previous_lessons_learned"
  | "mission_history"
  | "current_mission_context";

export type ContextStepStatus = "complete" | "degraded" | "failed";

export type ContextAlignmentSeverity = "critical" | "high" | "medium" | "low";

export interface ContextStepResult {
  step: ContextStepId;
  label: string;
  status: ContextStepStatus;
  artifactPaths: string[];
  summary: string;
  durationMs: number;
}

export interface ContextAlignmentFinding {
  domain:
    | "context"
    | "repository"
    | "architecture"
    | "production"
    | "mission"
    | "roadmap";
  severity: ContextAlignmentSeverity;
  signal: string;
  recommendation: string;
}

export interface ContextPackage {
  packageVersion: "P4-03";
  currentRoadmapItem: string;
  currentPhase: string;
  missionPurpose: string;
  relevantVision: string;
  relevantSoul: string;
  constitutionalArticles: string[];
  relevantArchitecture: string[];
  relevantRepositoryAreas: string[];
  relevantProductionComponents: string[];
  relevantLessons: string[];
  knownRisks: string[];
  dependencies: string[];
  acceptanceCriteria: string[];
  estimatedDuration: string;
  missionId: string | null;
}

export interface ContextSyncPipelineResult {
  pipelineVersion: "P4-03";
  synchronizedAt: string;
  durationMs: number;
  success: boolean;
  contextCompletenessPercent: number;
  steps: ContextStepResult[];
  alignmentFindings: ContextAlignmentFinding[];
  highestAlignmentSeverity: ContextAlignmentSeverity | null;
  contextPackage: ContextPackage;
  visionPipeline: VisionSyncPipelineResult;
  roadmapPosition: string;
  architectureVersion: string;
  repositoryVersion: string | null;
  productionAlignment: string;
}

export interface ContextSynchronizationState {
  engineVersion: "PILLOW-CS-001";
  status: "ready" | "synchronizing" | "degraded";
  initializedAt: string;
  lastSync: ContextSyncPipelineResult | null;
  totalSyncs: number;
  doctrinePath: string;
}

export interface ContextSyncRequest {
  missionId?: string | null;
  missionTitle?: string | null;
  grandKingOverride?: boolean;
}

export interface ContextBuilderGateResult {
  allowed: boolean;
  reason: string;
  overrideApplied: boolean;
  pipeline: ContextSyncPipelineResult;
}
