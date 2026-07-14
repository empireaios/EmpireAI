/** PILLOW-SA-001 — Screen Annotation types (T4-03). */

import type {
  ANNOTATION_DECISIONS,
  ANNOTATION_TYPES,
  ENGINE_STATUSES,
  PROCESSING_STATUSES,
} from "./paths.js";
import type { ScreenAnnotationConfiguration } from "./configuration.js";

export type ScreenAnnotationEngineVersion = "PILLOW-SA-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ProcessingStatus = (typeof PROCESSING_STATUSES)[number];
export type AnnotationType = (typeof ANNOTATION_TYPES)[number];
export type AnnotationDecision = (typeof ANNOTATION_DECISIONS)[number];

export type PointerCoordinates = {
  x: number;
  y: number;
};

export type ScreenRegionBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ScreenAnnotationRecord = {
  annotationId: string;
  timestamp: string;
  sessionId: string;
  currentScreenId: string | null;
  currentRouteOrViewId: string | null;
  annotationType: AnnotationType;
  pointerCoordinates: PointerCoordinates | null;
  screenRegionBounds: ScreenRegionBounds | null;
  referencedComponentIds: string[];
  referencedLayoutRegionIds: string[];
  referencedNavigationNodeIds: string[];
  linkedUxFindingIds: string[];
  linkedConversationIntentId: string | null;
  linkedVoiceCommandId: string | null;
  annotationText: string | null;
  userInstructionSummary: string;
  processingStatus: ProcessingStatus;
  confidenceScore: number;
  metadataVersion: string;
};

export type PointAndEditIntent = {
  pointAndEditIntentId: string;
  timestamp: string;
  sourceAnnotationId: string;
  sourceConversationIntentId: string | null;
  sourceVoiceCommandId: string | null;
  targetScreenId: string | null;
  targetRouteOrViewId: string | null;
  targetComponentIds: string[];
  targetLayoutRegionIds: string[];
  targetNavigationNodeIds: string[];
  requestedEditSummary: string;
  uxConcernSummary: string | null;
  designPreferenceSummary: string | null;
  linkedUxFindings: string[];
  linkedBuilderCapabilities: string[];
  clarificationRequirement: string | null;
  confidenceScore: number;
  metadataVersion: string;
};

export type AnnotationSession = {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  annotations: ScreenAnnotationRecord[];
  intents: PointAndEditIntent[];
  status: ProcessingStatus;
};

export type AnnotationRunValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: AnnotationDecision;
  annotationsProcessed: number;
  intentsGenerated: number;
  clarificationsRequested: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type AnnotationRunReport = {
  annotationRunReportId: string;
  runTimestamp: string;
  session: AnnotationSession;
  latestAnnotation: ScreenAnnotationRecord | null;
  latestIntent: PointAndEditIntent | null;
  validation: AnnotationRunValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type AnnotationHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  annotationEnabled: boolean;
  annotationsCompleted: number;
  lastAnnotationAt: string | null;
  lastAnnotationDecision: AnnotationDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  activeSessions: number;
  notes: string[];
};

export type AnnotationPerformanceStats = {
  totalAnnotations: number;
  successfulAnnotations: number;
  failedAnnotations: number;
  totalIntentsGenerated: number;
  clarificationsRequested: number;
  uxFindingsLinked: number;
  averageAnnotationDurationMs: number;
  peakAnnotationDurationMs: number;
};

export type AnnotationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ScreenAnnotationState = {
  engineVersion: ScreenAnnotationEngineVersion;
  missionId: "T4-03";
  status: EngineStatus;
  initializedAt: string;
  configuration: ScreenAnnotationConfiguration;
  latestReport: AnnotationRunReport | null;
  health: AnnotationHealthReport;
  performance: AnnotationPerformanceStats;
};

export type ScreenAnnotationCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: AnnotationHealthReport["status"];
  lastDecision: AnnotationDecision | null;
  activeSessions: number;
  totalAnnotations: number;
  intentsGenerated: number;
  clarificationsPending: number;
  confidenceScore: number;
  uxFindingsLinked: number;
  recentLogs: string[];
};

/** Input for a screen annotation capture. */
export type AnnotationInput = {
  sessionId?: string;
  annotationType: AnnotationType;
  pointerCoordinates?: PointerCoordinates | null;
  screenRegionBounds?: ScreenRegionBounds | null;
  annotationText?: string | null;
  linkedConversationIntentId?: string | null;
  linkedVoiceCommandId?: string | null;
  /** Explicit component/region/node refs when client already resolved them. */
  referencedComponentIds?: string[];
  referencedLayoutRegionIds?: string[];
  referencedNavigationNodeIds?: string[];
};
