/** PILLOW-AIE-001 — Adaptive Interface types (T5-06). */

import type {
  ADAPTATION_CATEGORIES,
  ADAPTATION_PRIORITIES,
  ADAPTATION_STATUSES,
  ENGINE_STATUSES,
} from "./paths.js";
import type { AdaptiveInterfaceConfiguration } from "./configuration.js";

export type AdaptiveInterfaceEngineVersion = "PILLOW-AIE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type AdaptationStatus = (typeof ADAPTATION_STATUSES)[number];
export type AdaptationCategory = (typeof ADAPTATION_CATEGORIES)[number];
export type AdaptationPriority = (typeof ADAPTATION_PRIORITIES)[number];

export type AdaptiveInterfaceRecord = {
  adaptiveInterfaceId: string;
  timestamp: string;
  sourceWorkflowEvolutionId: string | null;
  sourceProductivityIntelligenceId: string | null;
  sourceOpportunityId: string | null;
  sourceObservationId: string | null;
  currentScreenId: string | null;
  currentRouteOrViewId: string | null;
  currentWorkflowContext: string;
  recommendedInterfaceAdaptations: string[];
  recommendedNavigationAdaptations: string[];
  recommendedWorkspaceAdaptations: string[];
  expectedProductivityBenefit: string;
  adaptationCategory: AdaptationCategory;
  priority: AdaptationPriority;
  evidenceReferences: string[];
  confidenceScore: number;
  status: AdaptationStatus;
  metadataVersion: string;
  recommendOnly: true;
};

export type AdaptiveInterfaceProfile = {
  profileId: string;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  preferredLayoutPatterns: string[];
  preferredNavigationPatterns: string[];
  preferredWorkspaceOrganization: string[];
  recurringUsagePatterns: string[];
  confidenceScore: number;
  metadataVersion: string;
};

export type AdaptiveValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  recordsValidated: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type AdaptiveInterfaceRunReport = {
  adaptationRunReportId: string;
  runTimestamp: string;
  records: AdaptiveInterfaceRecord[];
  activeProfile: AdaptiveInterfaceProfile | null;
  validation: AdaptiveValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type AdaptationSessionRecord = {
  adaptationSessionId: string;
  startedAt: string;
  endedAt: string | null;
  status: EngineStatus;
  adaptationCyclesRecorded: number;
  adaptationCyclesFailed: number;
  adaptationsGenerated: number;
  lastAdaptationAt: string | null;
  lastScreenId: string | null;
  lastRouteId: string | null;
  continuousAdaptationActive: boolean;
};

export type AdaptiveHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  adaptationEnabled: boolean;
  continuousAdaptationActive: boolean;
  lastAdaptationAt: string | null;
  lastValidationDecision: AdaptiveValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  activeSessions: number;
  notes: string[];
};

export type AdaptivePerformanceStats = {
  totalAdaptationCycles: number;
  successfulAdaptationCycles: number;
  failedAdaptationCycles: number;
  totalAdaptations: number;
  layoutAdaptations: number;
  navigationAdaptations: number;
  workspaceAdaptations: number;
  contextDetections: number;
  duplicatesSkipped: number;
  averageAdaptationDurationMs: number;
  peakAdaptationDurationMs: number;
  skippedCycles: number;
};

export type AdaptiveLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type AdaptiveInterfaceState = {
  engineVersion: AdaptiveInterfaceEngineVersion;
  missionId: "T5-06";
  status: EngineStatus;
  initializedAt: string;
  configuration: AdaptiveInterfaceConfiguration;
  latestReport: AdaptiveInterfaceRunReport | null;
  activeSession: AdaptationSessionRecord | null;
  activeProfile: AdaptiveInterfaceProfile | null;
  topAdaptations: AdaptiveInterfaceRecord[];
  health: AdaptiveHealthReport;
  performance: AdaptivePerformanceStats;
};

export type AdaptiveInterfaceCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: AdaptiveHealthReport["status"];
  lastDecision: AdaptiveValidationReport["decision"] | null;
  continuousAdaptationActive: boolean;
  totalAdaptationCycles: number;
  totalAdaptations: number;
  topPriorityCount: number;
  confidenceScore: number;
  currentWorkflowContext: string | null;
  recentLogs: string[];
};

export type AdaptiveInterfaceInput = {
  sessionId?: string;
  forceAdaptation?: boolean;
  workflowEvolutionId?: string;
};

export type AdaptiveInterfaceEngineBundle = {
  workflowEvolution: import("../workflow-evolution-engine/engine.js").WorkflowEvolutionEngine | null;
  productivityIntelligence: import("../productivity-intelligence-engine/engine.js").ProductivityIntelligenceEngine | null;
  uxOpportunityDiscovery: import("../ux-opportunity-discovery-engine/engine.js").UxOpportunityDiscoveryEngine | null;
  autonomousUxAudit: import("../autonomous-ux-audit-engine/engine.js").AutonomousUxAuditEngine | null;
  continuousScreenObservation: import("../continuous-screen-observation-engine/engine.js").ContinuousScreenObservationEngine | null;
  contextAwareness: import("../context-awareness-engine/engine.js").ContextAwarenessEngine | null;
  interactionTracking: import("../interaction-tracking-engine/engine.js").InteractionTrackingEngine | null;
};

export type RawAdaptationCandidate = {
  adaptationCategory: AdaptationCategory;
  currentWorkflowContext: string;
  recommendedInterfaceAdaptations: string[];
  recommendedNavigationAdaptations: string[];
  recommendedWorkspaceAdaptations: string[];
  expectedProductivityBenefit: string;
  evidenceReferences: string[];
  confidenceScore: number;
  impactScore: number;
  sourceEngine: string;
  sourceWorkflowEvolutionId?: string | null;
  sourceProductivityIntelligenceId?: string | null;
  sourceOpportunityId?: string | null;
  sourceObservationId?: string | null;
};
