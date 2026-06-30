/** PILLOW-015 — Grand King Command Interface types. */

export type CommandIntent =
  | "continue"
  | "whats_next"
  | "build_next_mission"
  | "review_repository"
  | "review_progress"
  | "recover_cursor"
  | "review_architecture"
  | "review_empire_health"
  | "generate_cursor_mission"
  | "review_commercial_readiness"
  | "prepare_version_1"
  | "begin_pillow"
  | "pause_autonomous"
  | "resume_autonomous"
  | "unknown";

export type CommandCategory =
  | "engineering"
  | "repository"
  | "architecture"
  | "commercial"
  | "governance"
  | "recovery"
  | "mission_planning"
  | "executive_review"
  | "repository_synchronization"
  | "continuous_due_diligence"
  | "automation"
  | "general";

export interface CommandContextAwareness {
  journeyPosition: string | null;
  currentMission: string | null;
  repositoryHealthScore: number;
  outstandingMissions: number;
  activeEngineeringMissions: number;
  recoveryStatus: string;
  synchronizationStatus: string;
  executiveAuditStatus: string;
  commercialBlockers: string[];
  repositorySynchronized: boolean;
  grandKingPriorityActive: boolean;
}

export interface ExecutionPlanStep {
  order: number;
  label: string;
  module: string;
  status: "planned" | "coordinated" | "requires_confirmation" | "blocked";
}

export interface ExecutionPlan {
  intent: CommandIntent;
  category: CommandCategory;
  objective: string;
  relevantModules: string[];
  dependencyChecks: Array<{ id: string; satisfied: boolean; label: string }>;
  steps: ExecutionPlanStep[];
  requiresGrandKingConfirmation: boolean;
  repositoryEvidence: string[];
}

export interface CommandResponse {
  responseId: string;
  command: string;
  intent: CommandIntent;
  category: CommandCategory;
  awareness: CommandContextAwareness;
  plan: ExecutionPlan;
  message: string;
  coordinatedAt: string;
  durationMs: number;
  repositoryIntegrityPreserved: true;
}

export interface CommandEngineState {
  engineVersion: "PILLOW-015";
  status: "ready" | "processing" | "grand_king_priority";
  initializedAt: string;
  contractPath: string;
  totalCommands: number;
  lastCommand: string | null;
  grandKingPriorityActive: boolean;
}

export interface CommandEngineOptions {
  requireConfirmationForExecution?: boolean;
}

export interface ProcessCommandRequest {
  command: string;
  skipAutonomousPause?: boolean;
}
