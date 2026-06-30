/** PILLOW-013 — EmpireAI Orchestrator types. */

export type SubsystemId =
  | "bootstrap"
  | "intelligence"
  | "context_builder"
  | "memory"
  | "mission_planner"
  | "cursor_supervisor"
  | "recovery_manager"
  | "executive_audit_reviewer"
  | "repository_synchronizer"
  | "due_diligence"
  | "autonomous_improvement"
  | "live_repository_watcher"
  | "grand_king_command_interface"
  | "objective_engine";

export type SubsystemHealth = "ready" | "degraded" | "unavailable" | "deferred";

export interface SubsystemEntry {
  id: SubsystemId;
  label: string;
  missionId: string | null;
  health: SubsystemHealth;
  runtimePath: string | null;
  discoveredAt: string;
}

export type WorkerKind =
  | "engineering"
  | "testing"
  | "documentation"
  | "review"
  | "commercial"
  | "research";

export type WorkerAvailability = "available" | "busy" | "offline" | "deferred";

export interface WorkerEntry {
  id: string;
  label: string;
  kind: WorkerKind;
  availability: WorkerAvailability;
  replaceable: true;
  description: string;
}

export type WorkflowId =
  | "engineering"
  | "repository_synchronization"
  | "executive_review"
  | "mission_planning"
  | "recovery"
  | "architecture_improvement"
  | "commercial_improvement"
  | "continuous_due_diligence";

export interface WorkflowStep {
  order: number;
  label: string;
  subsystemId: SubsystemId;
  optional?: boolean;
}

export interface WorkflowDefinition {
  id: WorkflowId;
  label: string;
  steps: WorkflowStep[];
}

export type WorkflowStepStatus =
  | "pending"
  | "delegated"
  | "in_progress"
  | "completed"
  | "skipped"
  | "blocked";

export interface CoordinatedStep {
  step: WorkflowStep;
  status: WorkflowStepStatus;
  delegatedTo: string;
  notes?: string;
}

export interface WorkflowCoordinationResult {
  workflowId: WorkflowId;
  coordinatedAt: string;
  durationMs: number;
  steps: CoordinatedStep[];
  recommendation: string;
}

export type FailureAction =
  | "recovery_required"
  | "retry_appropriate"
  | "mission_postponement"
  | "escalation_required"
  | "grand_king_notification";

export interface FailureEvent {
  source: string;
  message: string;
  missionId?: string;
  recoverable?: boolean;
}

export interface FailureCoordinationResult {
  event: FailureEvent;
  actions: FailureAction[];
  recommendation: string;
  preserveRepositoryIntegrity: true;
}

export interface ScheduledWorkItem {
  id: string;
  label: string;
  priority: number;
  workflowId: WorkflowId;
  reason: string;
  blocked: boolean;
}

export interface SchedulingResult {
  scheduledAt: string;
  queue: ScheduledWorkItem[];
  grandKingOverride: boolean;
}

export interface RuntimeAwareness {
  activeMissions: number;
  queuedMissions: number;
  workerAvailability: Record<string, WorkerAvailability>;
  repositoryHealthScore: number;
  journeyPosition: string | null;
  currentMission: string | null;
  recoveryStatus: string;
  synchronizationStatus: string;
  executiveAuditStatus: string;
  subsystemHealth: Record<SubsystemId, SubsystemHealth>;
  grandKingPriorityActive: boolean;
}

export interface GrandKingCommand {
  command: string;
  issuedAt: string;
  priority: "grand_king";
}

export interface OrchestratorEngineState {
  engineVersion: "PILLOW-013";
  status: "ready" | "coordinating" | "grand_king_priority" | "paused";
  initializedAt: string;
  contractPath: string;
  subsystemCount: number;
  workerCount: number;
  workflowCount: number;
  grandKingPriorityActive: boolean;
  lastCommand: GrandKingCommand | null;
}

export interface OrchestratorEngineOptions {
  maxScheduledItems?: number;
}

export interface CoordinateWorkflowRequest {
  workflowId?: WorkflowId;
}

export interface OrchestratorExecutionResult {
  coordination: WorkflowCoordinationResult;
  scheduling: SchedulingResult;
  awareness: RuntimeAwareness;
}
