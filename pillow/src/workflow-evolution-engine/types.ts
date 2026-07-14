/** PILLOW-WFE-001 — Workflow Evolution types (T5-05). */

import type {
  ENGINE_STATUSES,
  EVOLUTION_CATEGORIES,
  EVOLUTION_PRIORITIES,
  EVOLUTION_STATUSES,
} from "./paths.js";
import type { WorkflowEvolutionConfiguration } from "./configuration.js";

export type WorkflowEvolutionEngineVersion = "PILLOW-WFE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EvolutionStatus = (typeof EVOLUTION_STATUSES)[number];
export type EvolutionCategory = (typeof EVOLUTION_CATEGORIES)[number];
export type EvolutionPriority = (typeof EVOLUTION_PRIORITIES)[number];

export type WorkflowEvolutionRecord = {
  workflowEvolutionId: string;
  timestamp: string;
  sourceProductivityIntelligenceId: string | null;
  sourceOpportunityId: string | null;
  sourceUxAuditId: string | null;
  sourceObservationId: string | null;
  currentScreenId: string | null;
  currentRouteOrViewId: string | null;
  workflowFrictionSummary: string;
  recommendedWorkflowImprovements: string[];
  estimatedProductivityBenefit: string;
  evolutionCategory: EvolutionCategory;
  priority: EvolutionPriority;
  evidenceReferences: string[];
  confidenceScore: number;
  status: EvolutionStatus;
  metadataVersion: string;
  recommendOnly: true;
};

export type WorkflowEvolutionValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  recordsValidated: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WorkflowEvolutionRunReport = {
  evolutionRunReportId: string;
  runTimestamp: string;
  records: WorkflowEvolutionRecord[];
  validation: WorkflowEvolutionValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type EvolutionSessionRecord = {
  evolutionSessionId: string;
  startedAt: string;
  endedAt: string | null;
  status: EngineStatus;
  evolutionCyclesRecorded: number;
  evolutionCyclesFailed: number;
  recommendationsGenerated: number;
  lastEvolutionAt: string | null;
  lastScreenId: string | null;
  lastRouteId: string | null;
  continuousEvolutionActive: boolean;
};

export type EvolutionHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  evolutionEnabled: boolean;
  continuousEvolutionActive: boolean;
  lastEvolutionAt: string | null;
  lastValidationDecision: WorkflowEvolutionValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  activeSessions: number;
  notes: string[];
};

export type EvolutionPerformanceStats = {
  totalEvolutionCycles: number;
  successfulEvolutionCycles: number;
  failedEvolutionCycles: number;
  totalRecommendations: number;
  simplificationRecommendations: number;
  navigationRecommendations: number;
  accelerationRecommendations: number;
  frictionDetections: number;
  duplicatesSkipped: number;
  averageEvolutionDurationMs: number;
  peakEvolutionDurationMs: number;
  skippedCycles: number;
};

export type EvolutionLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type WorkflowEvolutionState = {
  engineVersion: WorkflowEvolutionEngineVersion;
  missionId: "T5-05";
  status: EngineStatus;
  initializedAt: string;
  configuration: WorkflowEvolutionConfiguration;
  latestReport: WorkflowEvolutionRunReport | null;
  activeSession: EvolutionSessionRecord | null;
  topRecommendations: WorkflowEvolutionRecord[];
  health: EvolutionHealthReport;
  performance: EvolutionPerformanceStats;
};

export type WorkflowEvolutionCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: EvolutionHealthReport["status"];
  lastDecision: WorkflowEvolutionValidationReport["decision"] | null;
  continuousEvolutionActive: boolean;
  totalEvolutionCycles: number;
  totalRecommendations: number;
  topPriorityCount: number;
  confidenceScore: number;
  recentLogs: string[];
};

export type WorkflowEvolutionInput = {
  sessionId?: string;
  forceEvolution?: boolean;
  productivityId?: string;
};

export type WorkflowEvolutionEngineBundle = {
  productivityIntelligence: import("../productivity-intelligence-engine/engine.js").ProductivityIntelligenceEngine | null;
  uxOpportunityDiscovery: import("../ux-opportunity-discovery-engine/engine.js").UxOpportunityDiscoveryEngine | null;
  autonomousUxAudit: import("../autonomous-ux-audit-engine/engine.js").AutonomousUxAuditEngine | null;
  continuousScreenObservation: import("../continuous-screen-observation-engine/engine.js").ContinuousScreenObservationEngine | null;
};

export type RawEvolutionCandidate = {
  evolutionCategory: EvolutionCategory;
  workflowFrictionSummary: string;
  recommendedWorkflowImprovements: string[];
  estimatedProductivityBenefit: string;
  evidenceReferences: string[];
  confidenceScore: number;
  impactScore: number;
  sourceEngine: string;
  sourceProductivityIntelligenceId?: string | null;
  sourceOpportunityId?: string | null;
  sourceUxAuditId?: string | null;
  sourceObservationId?: string | null;
};
