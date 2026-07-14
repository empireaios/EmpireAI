/** PILLOW-CAE-001 — Context Awareness Engine types (T1-07). */

import type { AWARENESS_STATUSES, CONTEXT_STATES, INTERACTION_MODES } from "./paths.js";
import type { ContextAwarenessConfiguration } from "./configuration.js";

export type ContextAwarenessEngineVersion = "PILLOW-CAE-001";
export type AwarenessStatus = (typeof AWARENESS_STATUSES)[number];
export type ContextState = (typeof CONTEXT_STATES)[number];
export type InteractionMode = (typeof INTERACTION_MODES)[number];

export type WorkflowContextModel = {
  contextId: string;
  sessionId: string;
  timestamp: string;
  currentScreenId: string | null;
  currentRouteId: string | null;
  currentViewId: string | null;
  currentWorkflowName: string | null;
  currentWorkflowStage: string | null;
  currentUserTask: string | null;
  activeNavigationNodeId: string | null;
  activeLayoutRegionIds: string[];
  activeComponentIds: string[];
  activeFormIds: string[];
  activeModalOrDrawerId: string | null;
  recentInteractionEventIds: string[];
  currentInteractionMode: InteractionMode;
  contextState: ContextState;
  waitingOrLoading: boolean;
  confidence: number;
  metadataVersion: string;
};

export type ContextChangeSummary = {
  hasChanges: boolean;
  screenChanged: boolean;
  workflowChanged: boolean;
  stageChanged: boolean;
  taskChanged: boolean;
  modeChanged: boolean;
  stateChanged: boolean;
  previousContextState: ContextState | null;
  currentContextState: ContextState;
  previousInteractionMode: InteractionMode | null;
  currentInteractionMode: InteractionMode;
};

export type ContextSessionState = {
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  status: AwarenessStatus;
  contextsGenerated: number;
  contextsFailed: number;
  lastContextAt: string | null;
  lastScreenId: string | null;
};

export type ContextHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  awarenessEnabled: boolean;
  isAware: boolean;
  lastSuccessfulContextAt: string | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  averageProcessingDurationMs: number;
  contextsPerMinute: number;
  backlogSize: number;
  notes: string[];
};

export type ContextPerformanceStats = {
  totalContexts: number;
  successfulContexts: number;
  failedContexts: number;
  contextChanges: number;
  averageProcessingDurationMs: number;
  peakProcessingDurationMs: number;
  skippedUpdates: number;
  uptimeMs: number;
};

export type ContextLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ContextAwarenessState = {
  engineVersion: ContextAwarenessEngineVersion;
  missionId: "T1-07";
  status: AwarenessStatus;
  initializedAt: string;
  configuration: ContextAwarenessConfiguration;
  activeSession: ContextSessionState | null;
  latestContext: WorkflowContextModel | null;
  previousContext: WorkflowContextModel | null;
  health: ContextHealthReport;
  performance: ContextPerformanceStats;
};

export type ContextAwarenessCockpitSnapshot = {
  awarenessStatus: AwarenessStatus;
  healthStatus: string;
  contextsGenerated: number;
  currentWorkflowName: string | null;
  currentUserTask: string | null;
  contextState: ContextState | null;
  interactionMode: InteractionMode | null;
  changeDetected: boolean;
  confidenceScore: number;
  recoveryAttempts: number;
  recentLogs: string[];
};
