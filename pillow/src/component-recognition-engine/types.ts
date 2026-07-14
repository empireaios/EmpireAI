/** PILLOW-CRE-001 — Component Recognition Engine types (T1-03). */

import type { COMPONENT_TYPES, RECOGNITION_STATUSES } from "./paths.js";
import type { ComponentRecognitionConfiguration } from "./configuration.js";

export type ComponentRecognitionEngineVersion = "PILLOW-CRE-001";
export type RecognitionStatus = (typeof RECOGNITION_STATUSES)[number];
export type ComponentType = (typeof COMPONENT_TYPES)[number];

export type ComponentBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type UiComponent = {
  componentId: string;
  componentType: ComponentType;
  label: string | null;
  parentComponentId: string | null;
  childComponentIds: string[];
  bounds: ComponentBounds;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visibility: "visible" | "hidden" | "disabled";
  enabled: boolean;
  selected: boolean;
  active: boolean;
  sourceStateId: string;
  sourceRegionId: string;
  detectionConfidence: number;
  timestamp: string;
  metadataVersion: string;
};

export type ComponentChangeKind = "appeared" | "disappeared" | "changed" | "unchanged";

export type ComponentChange = {
  componentId: string;
  kind: ComponentChangeKind;
  previousType: ComponentType | null;
  currentType: ComponentType | null;
};

export type ComponentChangeSummary = {
  hasChanges: boolean;
  appeared: string[];
  disappeared: string[];
  changed: string[];
  unchanged: string[];
  changes: ComponentChange[];
};

export type ComponentRecognitionMetadata = {
  timestamp: string;
  sessionId: string;
  sourceStateId: string;
  recognitionId: string;
  version: string;
  viewport: { width: number; height: number };
  processingDurationMs: number;
  recognitionStatus: RecognitionStatus;
  totalComponents: number;
  error?: string;
};

export type ComponentRecognitionResult = {
  metadata: ComponentRecognitionMetadata;
  components: UiComponent[];
  hierarchy: { componentId: string; children: string[] }[];
  changeSummary: ComponentChangeSummary | null;
};

export type RecognitionSessionState = {
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  status: RecognitionStatus;
  recognitionsCompleted: number;
  recognitionsFailed: number;
  lastRecognitionAt: string | null;
  lastSourceStateId: string | null;
};

export type RecognitionHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  recognitionEnabled: boolean;
  isRecognizing: boolean;
  lastSuccessfulRecognitionAt: string | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  averageProcessingDurationMs: number;
  recognitionsPerMinute: number;
  backlogSize: number;
  notes: string[];
};

export type RecognitionPerformanceStats = {
  totalRecognitions: number;
  successfulRecognitions: number;
  failedRecognitions: number;
  totalComponentsDetected: number;
  averageProcessingDurationMs: number;
  peakProcessingDurationMs: number;
  skippedStates: number;
  uptimeMs: number;
};

export type RecognitionLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ComponentRecognitionState = {
  engineVersion: ComponentRecognitionEngineVersion;
  missionId: "T1-03";
  status: RecognitionStatus;
  initializedAt: string;
  configuration: ComponentRecognitionConfiguration;
  activeSession: RecognitionSessionState | null;
  latestResult: ComponentRecognitionResult | null;
  previousResult: ComponentRecognitionResult | null;
  health: RecognitionHealthReport;
  performance: RecognitionPerformanceStats;
};

export type ComponentRecognitionCockpitSnapshot = {
  recognitionStatus: RecognitionStatus;
  healthStatus: string;
  recognitionsCompleted: number;
  componentsDetected: number;
  latestRecognitionTimestamp: string | null;
  componentTypeCounts: Record<string, number>;
  changeDetected: boolean;
  confidenceThreshold: number;
  recoveryAttempts: number;
  recentLogs: string[];
};
