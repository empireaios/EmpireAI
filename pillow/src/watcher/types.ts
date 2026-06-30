/** PILLOW-014 — Live Repository Watcher types. */

export type ChangeKind =
  | "new_file"
  | "modified_file"
  | "deleted_file"
  | "renamed_file"
  | "restructured"
  | "journey_update"
  | "bl_update"
  | "executive_audit_added"
  | "synchronization"
  | "architecture_modification"
  | "doctrine_addition"
  | "contract_change"
  | "mission_completion"
  | "other";

export type ChangeClassification =
  | "engineering"
  | "repository"
  | "architecture"
  | "governance"
  | "journey"
  | "commercial"
  | "recovery"
  | "synchronization"
  | "documentation"
  | "configuration"
  | "other";

export type WatcherEventType =
  | "RepositoryUpdated"
  | "JourneyUpdated"
  | "ExecutiveAuditAdded"
  | "MissionCompleted"
  | "DoctrineUpdated"
  | "ArchitectureChanged"
  | "SynchronizationCompleted"
  | "RepositoryHealthChanged"
  | "DriftDetected";

export interface DetectedRepositoryChange {
  changeId: string;
  path: string;
  kind: ChangeKind;
  classification: ChangeClassification;
  summary: string;
  detectedAt: string;
}

export interface RepositoryDriftSignal {
  id: string;
  label: string;
  severity: "info" | "warning" | "critical";
  evidence: string[];
}

export interface WatcherEvent {
  eventId: string;
  type: WatcherEventType;
  classification: ChangeClassification;
  paths: string[];
  summary: string;
  changes: DetectedRepositoryChange[];
  emittedAt: string;
}

export interface WatcherEventBatch {
  batchId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  events: WatcherEvent[];
  driftSignals: RepositoryDriftSignal[];
  duplicateSuppressed: number;
}

export type WatcherSubscriberId =
  | "repository_memory"
  | "mission_planner"
  | "cursor_supervisor"
  | "executive_audit_reviewer"
  | "repository_synchronizer"
  | "due_diligence_engine"
  | "autonomous_improvement_engine"
  | "empire_ai_orchestrator"
  | "executive_direction";

export interface WatcherSubscriber {
  id: WatcherSubscriberId;
  label: string;
  onEvents: (batch: WatcherEventBatch) => void | Promise<void>;
}

export interface SubscriberNotification {
  subscriberId: WatcherSubscriberId;
  eventCount: number;
  notifiedAt: string;
}

export interface ObservationResult {
  batch: WatcherEventBatch;
  notifications: SubscriberNotification[];
  scannedPaths: number;
  recommendation: string;
}

export interface WatcherEngineState {
  engineVersion: "PILLOW-014";
  status: "ready" | "observing" | "paused";
  initializedAt: string;
  contractPath: string;
  totalObservations: number;
  totalEvents: number;
  subscriberCount: number;
  lastObservation: WatcherEventBatch | null;
}

export interface WatcherEngineOptions {
  batchRelatedEvents?: boolean;
  suppressDuplicates?: boolean;
}

export interface FileSnapshotEntry {
  path: string;
  sizeBytes: number;
  modifiedAt: string;
  present: boolean;
}

export interface RepositorySnapshot {
  capturedAt: string;
  fingerprint: string;
  entries: FileSnapshotEntry[];
}
