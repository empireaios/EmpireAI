/** PILLOW-008 — Recovery Manager types. */

import type { StallSignal, SupervisedMission } from "../supervisor/types.js";

export type RecoveryTrigger =
  | "dead_agent"
  | "stalled_mission"
  | "detached_background_process"
  | "interrupted_validation"
  | "interrupted_executive_audit"
  | "lost_mission_state"
  | "unexpected_cursor_termination"
  | "repository_interruption"
  | "supervisor_invocation";

export type RecoveryStrategy =
  | "resume_implementation"
  | "resume_validation"
  | "resume_executive_audit"
  | "mission_already_complete"
  | "recovery_impossible";

export type RecoveryIssueKind =
  | "repository"
  | "validation"
  | "cursor"
  | "mission"
  | "architecture";

export type RecoveryOutcome =
  | "recovered_successfully"
  | "recovered_with_warnings"
  | "recovery_failed"
  | "manual_intervention_required"
  | "mission_already_complete";

export interface RepositoryInspection {
  modifiedFiles: string[];
  createdFiles: string[];
  gitDiffAvailable: boolean;
  repositoryIntegrityOk: boolean;
  diffSummary: string;
  inspectedAt: string;
}

export interface AcceptanceCriteriaStatus {
  id: string;
  label: string;
  completed: boolean;
}

export interface MissionDiagnosis {
  missionId: string;
  title: string;
  objective: string;
  currentState: SupervisedMission["state"];
  validationStatus: "unknown" | "passed" | "failed" | "not_run";
  executiveAuditStatus: "unknown" | "produced" | "missing";
  acceptanceCriteria: AcceptanceCriteriaStatus[];
  completedCriteriaCount: number;
  incompleteCriteriaCount: number;
  issueKind: RecoveryIssueKind;
}

export interface RecoveryProcedureStep {
  step: number;
  label: string;
  status: "pending" | "completed" | "skipped" | "failed";
  detail: string;
}

export interface ValidationCycleResult {
  typecheckPassed: boolean;
  buildPassed: boolean;
  executed: boolean;
  dryRun: boolean;
  output: string;
}

export interface RecoveryRecord {
  recordId: string;
  missionId: string;
  trigger: RecoveryTrigger;
  outcome: RecoveryOutcome;
  strategy: RecoveryStrategy;
  invokedBy: "cursor_supervisor";
  startedAt: string;
  completedAt: string;
  durationMs: number;
  inspection: RepositoryInspection;
  diagnosis: MissionDiagnosis;
  steps: RecoveryProcedureStep[];
  validation: ValidationCycleResult | null;
  resumeTarget: string;
  warnings: string[];
  preservedWork: string[];
  doctrinePath: string;
}

export interface RecoveryExecutionResult {
  record: RecoveryRecord;
  recovered: boolean;
  resumeState: SupervisedMission["state"];
  recommendation: string;
}

export interface RecoveryManagerState {
  managerVersion: "PILLOW-008";
  status: "ready";
  initializedAt: string;
  doctrinePath: string;
  totalRecoveries: number;
  lastRecovery: RecoveryRecord | null;
}

export interface RecoveryRequest {
  mission: SupervisedMission;
  trigger: RecoveryTrigger;
  stallSignals?: StallSignal[];
}

export interface RecoveryManagerOptions {
  /** Skip shell validation — for unit tests */
  dryRunValidation?: boolean;
  /** Package directory for validation (default: pillow/) */
  validationPackageDir?: string;
}
