/** PILLOW-BM-001 — Builder Monitor types (P6-04). */

import type {
  BUILDER_MONITOR_EVENTS,
  BUILDER_TELEMETRY_FIELDS,
  INTERROGATION_DOMAINS,
  INTERROGATION_FREQUENCIES,
} from "./paths.js";

export type BuilderMonitorEventKind = (typeof BUILDER_MONITOR_EVENTS)[number];
export type BuilderTelemetryField = (typeof BUILDER_TELEMETRY_FIELDS)[number];
export type InterrogationDomain = (typeof INTERROGATION_DOMAINS)[number];
export type InterrogationFrequencies = typeof INTERROGATION_FREQUENCIES;

export interface BuilderMonitorRequest {
  missionId?: string | null;
  missionTitle?: string | null;
  roadmapItem?: string | null;
  grandKingOverride?: boolean;
}

export interface BuilderTelemetrySnapshot {
  capturedAt: string;
  currentMission: string | null;
  currentRoadmapItem: string | null;
  currentPhase: string | null;
  currentStep: string | null;
  currentActivity: string | null;
  missionState: string | null;
  overallProgress: number;
  stageProgress: number;
  estimatedRemainingTimeMs: number | null;
  elapsedTimeMs: number;
  currentFile: string | null;
  filesModified: string[];
  repositoryActivity: string | null;
  currentBranch: string | null;
  currentDependency: string | null;
  currentQueue: string | null;
  currentWorker: string;
  validationState: string;
  productionState: string;
  recoveryState: string;
  currentErrors: string[];
  currentWarnings: string[];
  heartbeatAt: string | null;
  executionHealth: "healthy" | "attention" | "degraded" | "critical";
}

export interface BuilderMonitorEventRecord {
  at: string;
  kind: BuilderMonitorEventKind;
  missionId: string | null;
  detail: string;
  telemetry: Partial<BuilderTelemetrySnapshot>;
}

export interface MissionTimelineEntry {
  at: string;
  observedState: string;
  progress: number;
  etaMs: number | null;
  repositoryActivity: string | null;
  recoveryActivity: string | null;
  validationActivity: string | null;
  supervisorObservation: string;
}

export interface InterrogationResult {
  domain: InterrogationDomain;
  status: "verified" | "degraded" | "unknown";
  detail: string;
  observedAt: string;
}

export interface SupervisorInterrogationReport {
  interrogatedAt: string;
  missionId: string | null;
  results: InterrogationResult[];
  risks: string[];
  bottlenecks: string[];
  telemetry: BuilderTelemetrySnapshot;
  grandKingSummary: string;
}

export interface BuilderMonitorReadinessPipeline {
  pipelineVersion: "P6-04";
  success: boolean;
  readinessScore: number;
  doctrinePresent: boolean;
  telemetryDocumented: boolean;
  eventsDocumented: boolean;
  frequenciesDocumented: boolean;
  supervisorIntegrationReady: boolean;
  recommendedAction: string;
  steps: Array<{ label: string; status: string; summary: string }>;
}

export interface BuilderMonitorBuilderGateResult {
  allowed: boolean;
  reason: string;
  overrideApplied: boolean;
  readinessScore: number;
  pipeline: BuilderMonitorReadinessPipeline;
}

export interface BuilderMonitorEngineState {
  engineVersion: "PILLOW-BM-001";
  status: "ready" | "degraded" | "blocked";
  initializedAt: string;
  doctrinePath: string;
  companionPath: string;
  surfacesAttached: boolean;
  lastInterrogation: SupervisorInterrogationReport | null;
}

export interface BuilderMonitorAssessment {
  success: boolean;
  executionHealth: BuilderTelemetrySnapshot["executionHealth"];
  telemetryComplete: boolean;
  interrogationCount: number;
  timelineEntries: number;
  recommendations: string[];
  grandKingSummary: string;
}

export interface BuilderMonitorMetrics {
  totalResponsibilities: number;
  telemetryFields: number;
  eventTypes: number;
  interrogationDomains: number;
  readinessScore: number;
  timelineEntries: number;
  heartbeatsReceived: number;
  trend: "stable" | "improving" | "degrading";
}

export interface BuilderMonitorAnalysis {
  executionQuality: string[];
  executionEfficiency: string[];
  recurringBottlenecks: string[];
  missionDuration: string[];
  repositoryBehaviour: string[];
  recommendations: string[];
}
