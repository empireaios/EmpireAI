/** PILLOW-006 — Mission Planner types. */

export type MissionCategory =
  | "ux"
  | "real"
  | "global_component"
  | "executive_component"
  | "repository"
  | "journey"
  | "journey_audit"
  | "bl_a"
  | "bl_b"
  | "bl_c"
  | "architecture"
  | "governance"
  | "pillow"
  | "recovery"
  | "executive_review"
  | "repository_synchronization"
  | "commercial_intelligence";

export type MissionPriority =
  | "critical"
  | "high"
  | "normal"
  | "low"
  | "deferred";

export type MissionReadiness =
  | "ready"
  | "blocked"
  | "dependencies_incomplete"
  | "deferred";

export interface MissionEvidence {
  source: string;
  artifact?: string;
  detail: string;
}

export interface MissionDependencyCheck {
  id: string;
  label: string;
  satisfied: boolean;
  required: boolean;
  evidence: MissionEvidence[];
}

export interface MissionCandidate {
  id: string;
  title: string;
  category: MissionCategory;
  priority: MissionPriority;
  readiness: MissionReadiness;
  sequenceOrder: number;
  dependencies: MissionDependencyCheck[];
  blockedBy: string[];
  evidence: MissionEvidence[];
  objective: string;
  authority: string;
}

export interface MissionIntelligence {
  repositoryPosition: string | null;
  currentMission: string | null;
  completedCount: number;
  pendingCount: number;
  blockedCount: number;
  repositoryHealthScore: number;
  architectureReady: boolean;
  commercialReady: boolean;
  governanceReady: boolean;
  syncRequired: boolean;
  driftSignals: string[];
}

export interface MissionPlan {
  plannerVersion: "PILLOW-006";
  status: "ready";
  plannedAt: string;
  durationMs: number;
  repositoryFingerprint: string;
  intelligence: MissionIntelligence;
  queue: MissionCandidate[];
  nextMission: MissionCandidate | null;
  blockedMissions: MissionCandidate[];
}

export interface CursorMissionDocument {
  missionId: string;
  title: string;
  missionType: string;
  authority: string;
  objective: string;
  dependencies: MissionDependencyCheck[];
  implementationRules: string[];
  acceptanceCriteria: string[];
  validation: string[];
  executiveAudit: string[];
  stopRule: string;
  evidence: MissionEvidence[];
  formatted: string;
}

export interface MissionPlannerOptions {
  /** Override next mission id for testing */
  forceMissionId?: string;
}
