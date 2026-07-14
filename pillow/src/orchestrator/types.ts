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
  | "objective_engine"
  | "technical_chief"
  | "ux_designer"
  | "cursor_bridge"
  | "vision_synchronization"
  | "context_synchronization"
  | "cursor_protocol"
  | "recovery_doctrine"
  | "browser_truth"
  | "visual_capture"
  | "ui_state_mapper"
  | "component_recognition"
  | "layout_understanding"
  | "navigation_mapping"
  | "interaction_tracking"
  | "context_awareness"
  | "visual_memory"
  | "session_continuity"
  | "visual_foundation_certification"
  | "ux_rule_engine"
  | "design_system_intelligence"
  | "executive_style_learning"
  | "layout_evaluation"
  | "workflow_optimization"
  | "accessibility_intelligence"
  | "visual_consistency"
  | "ux_scoring"
  | "recommendation_engine"
  | "ux_intelligence_certification"
  | "frontend_builder"
  | "component_generator"
  | "layout_refactoring"
  | "theme_builder"
  | "preview_generator"
  | "validation_engine"
  | "regression_protection"
  | "rollback_manager"
  | "change_documentation"
  | "autonomous_builder_certification"
  | "natural_ux_conversation"
  | "voice_ux_commands"
  | "screen_annotation"
  | "multi_proposal_generator"
  | "side_by_side_comparison"
  | "explain_decisions"
  | "approval_workflow"
  | "preference_learning"
  | "continuous_collaboration"
  | "executive_collaboration_certification"
  | "continuous_screen_observation"
  | "autonomous_ux_audit"
  | "ux_opportunity_discovery"
  | "productivity_intelligence"
  | "workflow_evolution"
  | "adaptive_interface"
  | "continuous_ux_evolution"
  | "executive_workspace_intelligence"
  | "self_improving_ux"
  | "visual_intelligence_certification"
  | "e2e_testing"
  | "journey_system"
  | "brain_runtime"
  | "production_mode"
  | "durable_sessions"
  | "guardian_monitoring"
  | "scaling_architecture"
  | "performance_governance"
  | "execution_control_center"
  | "vision_integrity_engine"
  | "builder_monitor"
  | "eta_engine"
  | "autonomous_recovery_engine"
  | "zero_human_automation"
  | "founder_shell"
  | "infrastructure_commander"
  | "commerce_intelligence"
  | "marketplace_connector_framework"
  | "amazon_marketplace_integration"
  | "amazon_product_intelligence"
  | "amazon_order_management"
  | "amazon_inventory_sync"
  | "walmart_marketplace_integration"
  | "etsy_marketplace_integration"
  | "empire_commander"
  | "empire_operating_system"
  | "continuous_evolution";

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
