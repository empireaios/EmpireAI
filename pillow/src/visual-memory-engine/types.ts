/** PILLOW-VME-001 — Visual Memory Engine types (T1-08). */

import type { MEMORY_STATUSES, RETENTION_CATEGORIES } from "./paths.js";
import type { VisualMemoryConfiguration } from "./configuration.js";

export type VisualMemoryEngineVersion = "PILLOW-VME-001";
export type MemoryStatus = (typeof MEMORY_STATUSES)[number];
export type RetentionCategory = (typeof RETENTION_CATEGORIES)[number];

export type VisualMemoryRecord = {
  memoryRecordId: string;
  sessionId: string;
  timestamp: string;
  sourceFrameId: string | null;
  sourceUiStateId: string;
  sourceComponentSetId: string | null;
  sourceLayoutId: string | null;
  sourceNavigationGraphId: string | null;
  sourceWorkflowContextId: string | null;
  relatedInteractionEventIds: string[];
  screenId: string | null;
  routeOrViewId: string | null;
  snapshotReference: string | null;
  stateSummary: string;
  changeSummary: string | null;
  storageLocation: string;
  retentionCategory: RetentionCategory;
  confidence: number;
  metadataVersion: string;
};

export type MemoryComparisonResult = {
  memoryRecordId: string;
  comparedAt: string;
  hasDifferences: boolean;
  screenChanged: boolean;
  layoutChanged: boolean;
  navigationChanged: boolean;
  componentCountDelta: number;
  interactionCountDelta: number;
  summary: string;
};

export type MemorySessionState = {
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  status: MemoryStatus;
  recordsStored: number;
  recordsFailed: number;
  lastRecordAt: string | null;
  lastScreenId: string | null;
};

export type MemoryHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  memoryEnabled: boolean;
  isRecording: boolean;
  lastSuccessfulRecordAt: string | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  averageStorageDurationMs: number;
  recordsPerMinute: number;
  backlogSize: number;
  totalStoredRecords: number;
  storageUsedBytes: number;
  notes: string[];
};

export type MemoryPerformanceStats = {
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  maskedSensitiveFields: number;
  retrievals: number;
  comparisons: number;
  cleanups: number;
  averageStorageDurationMs: number;
  peakStorageDurationMs: number;
  skippedCaptures: number;
  uptimeMs: number;
};

export type MemoryLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type VisualMemoryState = {
  engineVersion: VisualMemoryEngineVersion;
  missionId: "T1-08";
  status: MemoryStatus;
  initializedAt: string;
  configuration: VisualMemoryConfiguration;
  activeSession: MemorySessionState | null;
  latestRecord: VisualMemoryRecord | null;
  health: MemoryHealthReport;
  performance: MemoryPerformanceStats;
};

export type VisualMemoryCockpitSnapshot = {
  memoryStatus: MemoryStatus;
  healthStatus: string;
  recordsStored: number;
  latestScreenId: string | null;
  latestWorkflowContextId: string | null;
  storageUsedBytes: number;
  retentionCategory: RetentionCategory | null;
  confidenceScore: number;
  recoveryAttempts: number;
  recentLogs: string[];
};

export type MemoryIndexEntry = {
  memoryRecordId: string;
  sessionId: string;
  timestamp: string;
  screenId: string | null;
  routeOrViewId: string | null;
  sourceWorkflowContextId: string | null;
  componentIds: string[];
  retentionCategory: RetentionCategory;
  storageLocation: string;
};
