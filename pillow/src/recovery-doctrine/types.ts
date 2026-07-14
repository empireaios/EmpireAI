/** PILLOW-RD-001 — Recovery Doctrine types (P4-05). */

import type { RecoveryExecutionResult, RecoveryRecord, RecoveryTrigger } from "../recovery/types.js";
import type { StallSignal, SupervisedMission } from "../supervisor/types.js";
import type {
  AUTONOMOUS_RECOVERY_ACTIONS,
  ESCALATION_LEVELS,
  FAILURE_CLASSIFICATIONS,
  RECOVERY_PIPELINE_STEPS,
} from "./paths.js";

export type FailureClassification = (typeof FAILURE_CLASSIFICATIONS)[number];
export type EscalationLevel = (typeof ESCALATION_LEVELS)[number];
export type AutonomousRecoveryAction = (typeof AUTONOMOUS_RECOVERY_ACTIONS)[number];
export type RecoveryPipelineStepId = (typeof RECOVERY_PIPELINE_STEPS)[number];

export type RecoveryPipelineStepStatus = "pending" | "completed" | "skipped" | "failed";

export interface RecoveryPipelineStep {
  id: RecoveryPipelineStepId;
  label: string;
  status: RecoveryPipelineStepStatus;
  detail: string;
}

export interface RecoveryDoctrineState {
  engineVersion: "PILLOW-RD-001";
  status: "ready" | "degraded" | "blocked";
  initializedAt: string;
  doctrinePath: string;
  companionPath: string;
  totalPipelineRuns: number;
  totalRecoveriesAttempted: number;
  totalRecoveriesSucceeded: number;
  lastPipeline: RecoveryPipelineResult | null;
}

export interface RecoveryDoctrineRequest {
  missionId?: string | null;
  missionTitle?: string | null;
  grandKingOverride?: boolean;
}

export interface RecoveryBuilderGateResult {
  allowed: boolean;
  reason: string;
  overrideApplied: boolean;
  readinessScore: number;
  pipeline: RecoveryReadinessPipeline;
}

export interface RecoveryReadinessPipeline {
  pipelineVersion: "P4-05";
  success: boolean;
  readinessScore: number;
  doctrinePresent: boolean;
  managerReady: boolean;
  repositoryHealthy: boolean;
  escalationLevel: EscalationLevel;
  recommendedAction: string;
  steps: Array<{ label: string; status: string; summary: string }>;
}

export interface RecoveryPipelineResult {
  pipelineVersion: "P4-05";
  missionId: string;
  trigger: RecoveryTrigger;
  classification: FailureClassification;
  rootCause: string;
  recoveryConfidence: number;
  escalationLevel: EscalationLevel;
  escalated: boolean;
  autonomousActions: AutonomousRecoveryAction[];
  steps: RecoveryPipelineStep[];
  execution: RecoveryExecutionResult | null;
  recovered: boolean;
  resumeState: SupervisedMission["state"] | null;
  report: RecoveryOutcomeReport;
  completedAt: string;
}

export interface RecoveryOutcomeReport {
  summary: string;
  filesModified: string[];
  architectureImpact: string;
  repositoryImpact: string;
  productionImpact: string;
  testsExecuted: string;
  acceptanceStatus: string;
  remainingRisks: string[];
  lessonsLearned: string;
  recommendedNextRoadmapItem: string;
}

export interface RecoveryMetrics {
  successRate: number;
  averageDurationMs: number;
  repeatedFailures: number;
  missionRecoveries: number;
  builderRecoveries: number;
  productionRecoveries: number;
  trend: "improving" | "stable" | "degrading";
}

export interface RecoveryEffectivenessReview {
  effectivenessScore: number;
  recurringFailures: string[];
  architecturalWeaknesses: string[];
  engineeringWeaknesses: string[];
  recommendations: string[];
  constitutionalImplications: string[];
}

export interface RecoveryMissionFailureRequest {
  mission: SupervisedMission;
  trigger: RecoveryTrigger;
  stallSignals?: StallSignal[];
  grandKingOverride?: boolean;
}
