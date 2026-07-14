/** PILLOW-CP-001 — Cursor Protocol types (P4-04). */

import type { ContextSyncPipelineResult } from "../context-synchronization/types.js";

/** P4-04 normative mission states (legacy PILLOW-007 states remain supported). */
export type CursorProtocolMissionState =
  | "queued"
  | "preparing"
  | "synchronizing"
  | "reviewing"
  | "planning"
  | "implementing"
  | "testing"
  | "validating"
  | "production_verification"
  | "awaiting_grand_king"
  | "completed"
  | "blocked"
  | "recovering"
  | "cancelled";

export type PreMissionCheckId =
  | "vision_synchronization"
  | "context_synchronization"
  | "roadmap_validation"
  | "architecture_validation"
  | "repository_validation"
  | "production_validation"
  | "dependency_validation"
  | "recovery_readiness"
  | "browser_truth_readiness"
  | "e2e_testing_readiness"
  | "journey_readiness"
  | "brain_runtime_readiness"
  | "production_mode_readiness"
  | "durable_session_readiness"
  | "guardian_monitoring_readiness"
  | "scaling_architecture_readiness"
  | "performance_governance_readiness"
  | "execution_control_center_readiness"
  | "vision_integrity_readiness";

export type PreMissionCheckStatus = "passed" | "failed" | "degraded";

export interface PreMissionCheckResult {
  id: PreMissionCheckId;
  label: string;
  status: PreMissionCheckStatus;
  detail: string;
}

export interface CursorProtocolEnvelope {
  protocolVersion: "P4-04";
  missionId: string | null;
  missionTitle: string;
  missionPurpose: string;
  why: string;
  what: string;
  how: string;
  proof: string;
  roadmapItem: string;
  dependencies: string[];
  estimatedCompletionTime: string;
  kingActionRequired: boolean;
  nextRoadmapItem: string | null;
  preMissionChecks: PreMissionCheckResult[];
  allPreMissionChecksPassed: boolean;
}

export interface ProtocolValidationResult {
  valid: boolean;
  missingSections: string[];
  presentSections: string[];
}

export interface CursorProtocolState {
  engineVersion: "PILLOW-CP-001";
  status: "ready" | "degraded";
  initializedAt: string;
  doctrinePath: string;
  totalApplications: number;
}

export interface CursorProtocolRequest {
  missionId?: string | null;
  missionTitle?: string | null;
  missionPurpose?: string | null;
  implementationBody?: string;
  dependencies?: string[];
  acceptanceCriteria?: string[];
  validationSteps?: string[];
  grandKingOverride?: boolean;
  contextPipeline?: ContextSyncPipelineResult;
}

export interface CursorProtocolGateResult {
  allowed: boolean;
  reason: string;
  overrideApplied: boolean;
  envelope: CursorProtocolEnvelope;
  formattedProtocol: string;
}

export interface MissionProgressReport {
  currentProgress: string;
  elapsedTime: string;
  estimatedRemainingTime: string;
  currentRisks: string[];
  blockingReason: string | null;
  recoveryAttempts: number;
  currentOwner: string;
  currentRoadmapItem: string;
}

export interface PostMissionReportTemplate {
  missionSummary: string;
  filesModified: string;
  architectureImpact: string;
  repositoryImpact: string;
  productionImpact: string;
  testsExecuted: string;
  acceptanceStatus: string;
  remainingRisks: string;
  lessonsLearned: string;
  recommendedNextRoadmapItem: string;
}
