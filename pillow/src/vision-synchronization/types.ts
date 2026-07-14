/** PILLOW-VS-001 — Vision Synchronization System types (P4-02). */

export type SyncStepId =
  | "vision"
  | "vision_accumulation"
  | "soul"
  | "ctd"
  | "constitution_hierarchy"
  | "roadmap"
  | "current_roadmap_item"
  | "architecture"
  | "repository"
  | "production_truth"
  | "current_production_state"
  | "previous_lessons_learned"
  | "mission_context"
  | "mission_generation";

export type DriftSeverity = "critical" | "high" | "medium" | "low";

export type SyncStepStatus = "complete" | "degraded" | "failed";

export interface SyncStepResult {
  step: SyncStepId;
  label: string;
  status: SyncStepStatus;
  artifactPaths: string[];
  summary: string;
  durationMs: number;
}

export type DriftDomain =
  | "vision"
  | "soul"
  | "constitution"
  | "architecture"
  | "repository"
  | "production"
  | "mission"
  | "roadmap";

export interface DriftFinding {
  domain: DriftDomain;
  severity: DriftSeverity;
  signal: string;
  recommendation: string;
}

export interface MissionContextPackage {
  packageVersion: "P4-02";
  missionId: string | null;
  visionSummary: string;
  currentWhy: string;
  currentRoadmapItem: string;
  constitutionalArticles: string[];
  relevantArchitecture: string[];
  relevantRepositoryAreas: string[];
  relevantProductionComponents: string[];
  knownRisks: string[];
  knownDependencies: string[];
  previousLessons: string[];
  acceptanceCriteria: string[];
  estimatedCompletionTime: string;
  why: string;
  what: string;
  how: string;
  proof: string;
}

export interface VisionSyncPipelineResult {
  pipelineVersion: "P4-02";
  synchronizedAt: string;
  durationMs: number;
  success: boolean;
  steps: SyncStepResult[];
  driftFindings: DriftFinding[];
  highestDriftSeverity: DriftSeverity | null;
  missionContext: MissionContextPackage;
  visionVersion: string | null;
  constitutionalState: string;
  architectureState: string;
  repositoryState: string;
  productionAlignment: string;
}

export interface VisionSynchronizationState {
  engineVersion: "PILLOW-VS-001";
  status: "ready" | "synchronizing" | "degraded";
  initializedAt: string;
  lastSync: VisionSyncPipelineResult | null;
  totalSyncs: number;
  doctrinePath: string;
}

export interface VisionSyncRequest {
  missionId?: string | null;
  missionTitle?: string | null;
  /** Grand King explicit override — Builder may proceed despite sync failure */
  grandKingOverride?: boolean;
}

export interface BuilderSyncGateResult {
  allowed: boolean;
  reason: string;
  overrideApplied: boolean;
  pipeline: VisionSyncPipelineResult;
}

export interface SupervisorSyncValidation {
  valid: boolean;
  health: "healthy" | "degraded" | "blocked";
  completionPercent: number;
  alignmentNotes: string[];
  pipeline: VisionSyncPipelineResult;
}
