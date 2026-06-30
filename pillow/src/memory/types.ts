/** PILLOW-005 — Repository Memory Engine types. */

export type MemoryDomain =
  | "journey_position"
  | "current_mission"
  | "completed_missions"
  | "pending_missions"
  | "architecture"
  | "repository_health"
  | "repository_owners"
  | "doctrines"
  | "contracts"
  | "executive_audits"
  | "decisions"
  | "ux_enhancements"
  | "global_components"
  | "executive_components"
  | "real_owners"
  | "bl_documents"
  | "architecture_decisions"
  | "sync_state";

export interface MemoryProvenance {
  sources: string[];
  derivedFrom: "bootstrap" | "intelligence" | "bootstrap+intelligence";
}

export interface MemoryItem<T> {
  domain: MemoryDomain;
  value: T;
  provenance: MemoryProvenance;
}

export interface MissionMemoryEntry {
  id: string;
  label: string;
  status: string;
  phase?: string;
}

export interface OwnerMemoryEntry {
  id: string;
  label: string;
  path?: string;
}

export interface AuditMemoryEntry {
  id: string;
  path: string;
  modifiedAt: string | null;
}

export interface EnhancementMemoryEntry {
  id: string;
  label: string;
  source: string;
}

export interface SyncStateMemory {
  repositoryFingerprint: string;
  repositoryVersion: string | null;
  bootstrapCompletedAt: string;
  intelligenceCompletedAt: string;
  journeyAuditPath: string;
  activeBacklogRelease: string | null;
  closedBacklogReleases: string[];
}

export interface MemoryConsistencyReport {
  synchronized: boolean;
  stale: boolean;
  fingerprintMatch: boolean;
  incompleteRefresh: boolean;
  driftSignals: string[];
  issues: string[];
}

export interface RepositoryMemoryDomains {
  journeyPosition: MemoryItem<string | null>;
  currentMission: MemoryItem<string | null>;
  completedMissions: MemoryItem<MissionMemoryEntry[]>;
  pendingMissions: MemoryItem<MissionMemoryEntry[]>;
  architecture: MemoryItem<OwnerMemoryEntry[]>;
  repositoryHealth: MemoryItem<{
    score: number;
    mandatoryPresent: number;
    mandatoryTotal: number;
    issueCount: number;
  }>;
  repositoryOwners: MemoryItem<OwnerMemoryEntry[]>;
  doctrines: MemoryItem<OwnerMemoryEntry[]>;
  contracts: MemoryItem<OwnerMemoryEntry[]>;
  executiveAudits: MemoryItem<AuditMemoryEntry[]>;
  decisions: MemoryItem<{ adrCount: number; entries: OwnerMemoryEntry[] }>;
  uxEnhancements: MemoryItem<EnhancementMemoryEntry[]>;
  globalComponents: MemoryItem<OwnerMemoryEntry[]>;
  executiveComponents: MemoryItem<OwnerMemoryEntry[]>;
  realOwners: MemoryItem<OwnerMemoryEntry[]>;
  blDocuments: MemoryItem<OwnerMemoryEntry[]>;
  architectureDecisions: MemoryItem<OwnerMemoryEntry[]>;
  syncState: MemoryItem<SyncStateMemory>;
}

export interface RepositoryMemoryState {
  memoryVersion: "PILLOW-005";
  status: "ready";
  initializedAt: string;
  refreshedAt: string;
  durationMs: number;
  repositoryFingerprint: string;
  domains: RepositoryMemoryDomains;
  consistency: MemoryConsistencyReport;
}

export type MemoryService =
  | "mission_planner"
  | "executive_audit_reviewer"
  | "repository_synchronizer"
  | "due_diligence_engine"
  | "autonomous_improvement_engine"
  | "empire_ai_orchestrator"
  | "live_repository_watcher"
  | "grand_king_command_interface"
  | "cursor_supervisor"
  | "recovery_manager"
  | "grand_king_command"
  | "context_builder";
