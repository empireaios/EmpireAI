/** PILLOW-SCE-001 — Session Continuity Engine types (T1-09). */

import type {
  CONTINUITY_STATUSES,
  RECOVERY_STATUSES,
  SESSION_EVENTS,
  STABLE_STATE_KINDS,
} from "./paths.js";
import type { SessionContinuityConfiguration } from "./configuration.js";

export type SessionContinuityEngineVersion = "PILLOW-SCE-001";
export type ContinuityStatus = (typeof CONTINUITY_STATUSES)[number];
export type RecoveryStatus = (typeof RECOVERY_STATUSES)[number];
export type SessionEventType = (typeof SESSION_EVENTS)[number];
export type StableStateKind = (typeof STABLE_STATE_KINDS)[number];

export type SessionContinuityModel = {
  sessionContinuityId: string;
  sessionId: string;
  actorIdentifier: string | null;
  timestamp: string;
  currentScreenId: string | null;
  currentRouteOrViewId: string | null;
  currentWorkflowContextId: string | null;
  currentWorkflowStage: string | null;
  currentNavigationNodeId: string | null;
  currentLayoutId: string | null;
  currentUiStateId: string | null;
  recentMemoryRecordIds: string[];
  recentInteractionEventIds: string[];
  activeComponentIds: string[];
  activeLayoutRegionIds: string[];
  activeModalDrawerTabPanelIds: string[];
  lastKnownStableState: StableStateKind | null;
  recoveryStatus: RecoveryStatus;
  continuityConfidence: number;
  metadataVersion: string;
};

export type SessionChangeSummary = {
  hasChanges: boolean;
  screenChanged: boolean;
  routeChanged: boolean;
  workflowChanged: boolean;
  navigationChanged: boolean;
  uiStateChanged: boolean;
  interruptionDetected: boolean;
  recoveryRequired: boolean;
  previousScreenId: string | null;
  currentScreenId: string | null;
};

export type ContinuitySessionState = {
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  status: ContinuityStatus;
  updatesApplied: number;
  updatesFailed: number;
  recoveriesAttempted: number;
  lastUpdateAt: string | null;
  lastScreenId: string | null;
  lastEvent: SessionEventType | null;
};

export type ContinuityHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  continuityEnabled: boolean;
  isActive: boolean;
  lastSuccessfulUpdateAt: string | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  averageProcessingDurationMs: number;
  updatesPerMinute: number;
  backlogSize: number;
  notes: string[];
};

export type ContinuityPerformanceStats = {
  totalUpdates: number;
  successfulUpdates: number;
  failedUpdates: number;
  interruptionsDetected: number;
  recoveriesCompleted: number;
  rehydrations: number;
  stableStatesDetected: number;
  averageProcessingDurationMs: number;
  peakProcessingDurationMs: number;
  skippedUpdates: number;
  uptimeMs: number;
};

export type ContinuityLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type SessionContinuityState = {
  engineVersion: SessionContinuityEngineVersion;
  missionId: "T1-09";
  status: ContinuityStatus;
  initializedAt: string;
  configuration: SessionContinuityConfiguration;
  activeSession: ContinuitySessionState | null;
  latestContinuity: SessionContinuityModel | null;
  previousContinuity: SessionContinuityModel | null;
  health: ContinuityHealthReport;
  performance: ContinuityPerformanceStats;
};

export type SessionContinuityCockpitSnapshot = {
  continuityStatus: ContinuityStatus;
  healthStatus: string;
  updatesApplied: number;
  currentScreenId: string | null;
  recoveryStatus: RecoveryStatus | null;
  lastKnownStableState: StableStateKind | null;
  continuityConfidence: number;
  interruptionDetected: boolean;
  recoveryAttempts: number;
  recentLogs: string[];
};

export type PersistedSessionSnapshot = {
  sessionId: string;
  actorIdentifier: string | null;
  lastContinuity: SessionContinuityModel | null;
  lastPersistedAt: string;
  restartDetected: boolean;
};
