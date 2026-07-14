/** PILLOW-CSO-001 — Continuous Screen Observation types (T5-01). */

import type {
  ENGINE_STATUSES,
  OBSERVATION_STATUSES,
  UI_SURFACE_STATES,
} from "./paths.js";
import type { ContinuousScreenObservationConfiguration } from "./configuration.js";

export type ContinuousScreenObservationEngineVersion = "PILLOW-CSO-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ObservationStatus = (typeof OBSERVATION_STATUSES)[number];
export type UiSurfaceState = (typeof UI_SURFACE_STATES)[number];

export type DetectedChangeSet = {
  screenChanges: string[];
  routeChanges: string[];
  layoutChanges: string[];
  componentChanges: string[];
  stateChanges: string[];
};

export type ObservationRecord = {
  observationId: string;
  timestamp: string;
  sessionId: string;
  currentScreenId: string | null;
  currentRouteOrViewId: string | null;
  sourceUiStateId: string | null;
  sourceComponentSetId: string | null;
  sourceLayoutId: string | null;
  sourceNavigationGraphId: string | null;
  detectedScreenChanges: string[];
  detectedComponentChanges: string[];
  detectedLayoutChanges: string[];
  detectedStateChanges: string[];
  observationStatus: ObservationStatus;
  confidenceScore: number;
  metadataVersion: string;
  uiSurfaceStates: UiSurfaceState[];
  observeOnly: true;
};

export type ObservationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  observationsValidated: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ContinuousObservationRunReport = {
  observationRunReportId: string;
  runTimestamp: string;
  observation: ObservationRecord;
  validation: ObservationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ObservationSessionRecord = {
  observationSessionId: string;
  startedAt: string;
  endedAt: string | null;
  status: EngineStatus;
  observationsRecorded: number;
  observationsFailed: number;
  lastObservationAt: string | null;
  lastScreenId: string | null;
  lastRouteId: string | null;
  continuousMonitoringActive: boolean;
};

export type ObservationHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  observationEnabled: boolean;
  continuousMonitoringActive: boolean;
  lastObservationAt: string | null;
  lastValidationDecision: ObservationValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  activeSessions: number;
  notes: string[];
};

export type ObservationPerformanceStats = {
  totalObservations: number;
  successfulObservations: number;
  failedObservations: number;
  screenChangesDetected: number;
  routeChangesDetected: number;
  layoutChangesDetected: number;
  componentChangesDetected: number;
  stateChangesDetected: number;
  averageObservationDurationMs: number;
  peakObservationDurationMs: number;
  skippedCycles: number;
};

export type ContinuousScreenObservationPerformanceStats = ObservationPerformanceStats;

export type ObservationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ContinuousScreenObservationState = {
  engineVersion: ContinuousScreenObservationEngineVersion;
  missionId: "T5-01";
  status: EngineStatus;
  initializedAt: string;
  configuration: ContinuousScreenObservationConfiguration;
  latestReport: ContinuousObservationRunReport | null;
  activeSession: ObservationSessionRecord | null;
  latestObservation: ObservationRecord | null;
  health: ObservationHealthReport;
  performance: ObservationPerformanceStats;
};

export type ContinuousScreenObservationCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: ObservationHealthReport["status"];
  lastDecision: ObservationValidationReport["decision"] | null;
  continuousMonitoringActive: boolean;
  totalObservations: number;
  screenChangesDetected: number;
  routeChangesDetected: number;
  layoutChangesDetected: number;
  componentChangesDetected: number;
  confidenceScore: number;
  recentLogs: string[];
};

export type ContinuousScreenObservationInput = {
  sessionId?: string;
  forceObservation?: boolean;
  uiSnapshot?: {
    screenId?: string | null;
    routeOrViewId?: string | null;
    uiStateId?: string | null;
    componentSetId?: string | null;
    layoutId?: string | null;
    navigationGraphId?: string | null;
    surfaceStates?: UiSurfaceState[];
  };
};

export type ContinuousScreenObservationEngineBundle = {
  visualCapture: import("../visual-capture-engine/engine.js").VisualCaptureEngine | null;
  uiStateMapper: import("../ui-state-mapper/engine.js").UiStateMapperEngine | null;
  componentRecognition: import("../component-recognition-engine/engine.js").ComponentRecognitionEngine | null;
  layoutUnderstanding: import("../layout-understanding-engine/engine.js").LayoutUnderstandingEngine | null;
  navigationMapping: import("../navigation-mapping-engine/engine.js").NavigationMappingEngine | null;
  interactionTracking: import("../interaction-tracking-engine/engine.js").InteractionTrackingEngine | null;
  contextAwareness: import("../context-awareness-engine/engine.js").ContextAwarenessEngine | null;
  uxScoring: import("../ux-scoring-engine/engine.js").UxScoringEngine | null;
  frontendBuilder: import("../frontend-builder/engine.js").FrontendBuilder | null;
  continuousCollaboration: import("../continuous-collaboration/engine.js").ContinuousCollaborationEngine | null;
  executiveCollaborationCertification: import("../executive-collaboration-certification-engine/engine.js").ExecutiveCollaborationCertificationEngine | null;
};
