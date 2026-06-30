/** PILLOW-007 — Cursor Supervisor types. */

import type { CursorMissionDocument } from "../planner/types.js";

export type CursorMissionState =
  | "queued"
  | "preparing"
  | "repository_inspection"
  | "implementation"
  | "validation"
  | "executive_audit"
  | "completed"
  | "recovery"
  | "failed"
  | "cancelled";

export type HeartbeatKind =
  | "repository_inspection"
  | "file_modified"
  | "validation"
  | "executive_audit"
  | "state_transition"
  | "repository_interaction"
  | "reasoning";

export type StallKind =
  | "waiting_background_process"
  | "waiting_detached_process"
  | "waiting_npm"
  | "waiting_build"
  | "reconnecting"
  | "taking_longer_than_expected"
  | "no_state_change"
  | "no_repository_activity"
  | "no_validation_progress"
  | "no_reasoning_progress";

export type MissionRiskLevel = "low" | "medium" | "high" | "critical";

export type MissionOutcome =
  | "pending"
  | "success"
  | "failed"
  | "recovered"
  | "cancelled";

export interface HeartbeatSignal {
  at: string;
  kind: HeartbeatKind;
  detail: string;
}

export interface ProgressEvent {
  at: string;
  kind:
    | "repository_analysis"
    | "file_created"
    | "file_modified"
    | "acceptance_criteria"
    | "validation_executed"
    | "executive_audit_generated"
    | "repository_synchronized";
  detail: string;
}

export interface StallSignal {
  kind: StallKind;
  detectedAt: string;
  message: string;
  doctrineRef: string;
}

export interface MissionHealth {
  score: number;
  riskLevel: MissionRiskLevel;
  stallSignals: StallSignal[];
  isDeadAgent: boolean;
  isSlowMission: boolean;
  lastProgressAt: string | null;
  lastHeartbeatAt: string | null;
  stateUnchangedMs: number;
}

export interface SupervisedMission {
  id: string;
  title: string;
  state: CursorMissionState;
  launchedAt: string;
  updatedAt: string;
  stateEnteredAt: string;
  durationMs: number;
  heartbeats: HeartbeatSignal[];
  progress: ProgressEvent[];
  health: MissionHealth;
  dependencies: string[];
  outcome: MissionOutcome;
  executiveAuditProduced: boolean;
  validationCompleted: boolean;
  recoveryAttempts: number;
  missionAuthority: string;
  objective: string;
}

export interface MissionRegistrySnapshot {
  activeMission: SupervisedMission | null;
  queued: SupervisedMission[];
  completed: SupervisedMission[];
  failed: SupervisedMission[];
  recovered: SupervisedMission[];
  history: SupervisedMission[];
}

export interface HeartbeatConfig {
  /** Ms without heartbeat before risk increases */
  heartbeatStaleMs: number;
  /** Ms without progress before stall consideration */
  progressStaleMs: number;
  /** Ms in same state before no_state_change stall */
  stateStaleMs: number;
  /** Ms before dead agent classification */
  deadAgentMs: number;
  /** Ms for slow-but-alive long-running validation */
  slowValidationMs: number;
}

export interface RecoveryStep {
  step: number;
  label: string;
  status: "pending" | "completed" | "skipped";
  detail: string;
}

export interface RecoveryAssessment {
  missionId: string;
  triggeredAt: string;
  stallSignals: StallSignal[];
  steps: RecoveryStep[];
  validationAlreadySucceeded: boolean;
  repositoryInspection: {
    modifiedFiles: number;
    createdFilesHint: string;
    gitDiffAvailable: boolean;
  };
  recommendation: string;
}

export interface RecoveryResult {
  assessment: RecoveryAssessment;
  missionState: CursorMissionState;
  recovered: boolean;
  /** Full PILLOW-008 recovery record when RecoveryManagerEngine is used */
  execution?: import("../recovery/types.js").RecoveryExecutionResult;
}

export interface ExecutiveAuditVerification {
  missionId: string;
  complete: boolean;
  hasExecutiveAudit: boolean;
  hasValidation: boolean;
  hasAcceptanceVerification: boolean;
  hasRepositoryContinuity: boolean;
  issues: string[];
}

export interface CursorSupervisorState {
  supervisorVersion: "PILLOW-007";
  status: "ready";
  initializedAt: string;
  doctrinePath: string;
  registry: MissionRegistrySnapshot;
  heartbeatConfig: HeartbeatConfig;
}

export interface LaunchMissionRequest {
  document: CursorMissionDocument;
  initialState?: CursorMissionState;
}

export interface LaunchMissionResult {
  mission: SupervisedMission;
  launched: boolean;
}

export interface SupervisionTickResult {
  evaluatedAt: string;
  missionsEvaluated: number;
  stallsDetected: number;
  recoveriesInvoked: number;
  deadAgentsDetected: number;
}

export interface CursorSupervisorOptions {
  heartbeatConfig?: Partial<HeartbeatConfig>;
  /** Inject clock for tests */
  now?: () => number;
  /** PILLOW-008 Recovery Manager engine */
  recoveryManager?: import("../recovery/engine.js").RecoveryManagerEngine;
  /** PILLOW-009 Executive Audit Reviewer engine */
  auditReviewer?: import("../audit-reviewer/engine.js").ExecutiveAuditReviewerEngine;
}

export const DEFAULT_HEARTBEAT_CONFIG: HeartbeatConfig = {
  heartbeatStaleMs: 120_000,
  progressStaleMs: 180_000,
  stateStaleMs: 300_000,
  deadAgentMs: 600_000,
  slowValidationMs: 900_000,
};
