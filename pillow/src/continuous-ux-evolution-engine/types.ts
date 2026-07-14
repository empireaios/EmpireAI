/** PILLOW-CUE-001 — Continuous UX Evolution types (T5-07). */

import type {
  EVOLUTION_CATEGORIES,
  EVOLUTION_STATUSES,
  ENGINE_STATUSES,
  IMPROVEMENT_PRIORITIES,
} from "./paths.js";
import type { ContinuousUxEvolutionConfiguration } from "./configuration.js";

export type ContinuousUxEvolutionEngineVersion = "PILLOW-CUE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EvolutionStatus = (typeof EVOLUTION_STATUSES)[number];
export type EvolutionCategory = (typeof EVOLUTION_CATEGORIES)[number];
export type ImprovementPriority = (typeof IMPROVEMENT_PRIORITIES)[number];

export type UxEvolutionRecord = {
  uxEvolutionId: string;
  timestamp: string;
  sourceAdaptiveInterfaceId: string | null;
  sourceWorkflowEvolutionId: string | null;
  sourceProductivityIntelligenceId: string | null;
  sourceOpportunityId: string | null;
  currentScreenId: string | null;
  currentRouteOrViewId: string | null;
  recommendedUxImprovements: string[];
  expectedUxBenefit: string;
  evolutionCategory: EvolutionCategory;
  improvementPriority: ImprovementPriority;
  evidenceReferences: string[];
  confidenceScore: number;
  status: EvolutionStatus;
  metadataVersion: string;
  recommendOnly: true;
};

export type EvolutionHistoryEntry = {
  historyId: string;
  sessionId: string;
  recordedAt: string;
  evolutionCategory: EvolutionCategory;
  improvementSummary: string;
  confidenceScore: number;
  metadataVersion: string;
};

export type EvolutionValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  recordsValidated: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ContinuousUxEvolutionRunReport = {
  evolutionRunReportId: string;
  runTimestamp: string;
  records: UxEvolutionRecord[];
  historyEntries: EvolutionHistoryEntry[];
  validation: EvolutionValidationReport;
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
  improvementsGenerated: number;
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
  lastValidationDecision: EvolutionValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  activeSessions: number;
  notes: string[];
};

export type EvolutionPerformanceStats = {
  totalEvolutionCycles: number;
  successfulEvolutionCycles: number;
  failedEvolutionCycles: number;
  totalImprovements: number;
  layoutEvolutions: number;
  navigationEvolutions: number;
  accessibilityEvolutions: number;
  workflowEvolutions: number;
  trendAnalyses: number;
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

export type ContinuousUxEvolutionState = {
  engineVersion: ContinuousUxEvolutionEngineVersion;
  missionId: "T5-07";
  status: EngineStatus;
  initializedAt: string;
  configuration: ContinuousUxEvolutionConfiguration;
  latestReport: ContinuousUxEvolutionRunReport | null;
  activeSession: EvolutionSessionRecord | null;
  evolutionHistory: EvolutionHistoryEntry[];
  topImprovements: UxEvolutionRecord[];
  health: EvolutionHealthReport;
  performance: EvolutionPerformanceStats;
};

export type ContinuousUxEvolutionCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: EvolutionHealthReport["status"];
  lastDecision: EvolutionValidationReport["decision"] | null;
  continuousEvolutionActive: boolean;
  totalEvolutionCycles: number;
  totalImprovements: number;
  topPriorityCount: number;
  confidenceScore: number;
  dominantEvolutionCategory: EvolutionCategory | null;
  recentLogs: string[];
};

export type ContinuousUxEvolutionInput = {
  sessionId?: string;
  forceEvolution?: boolean;
  adaptiveInterfaceId?: string;
};

export type ContinuousUxEvolutionEngineBundle = {
  adaptiveInterface: import("../adaptive-interface-engine/engine.js").AdaptiveInterfaceEngine | null;
  workflowEvolution: import("../workflow-evolution-engine/engine.js").WorkflowEvolutionEngine | null;
  productivityIntelligence: import("../productivity-intelligence-engine/engine.js").ProductivityIntelligenceEngine | null;
  uxOpportunityDiscovery: import("../ux-opportunity-discovery-engine/engine.js").UxOpportunityDiscoveryEngine | null;
  autonomousUxAudit: import("../autonomous-ux-audit-engine/engine.js").AutonomousUxAuditEngine | null;
  continuousScreenObservation: import("../continuous-screen-observation-engine/engine.js").ContinuousScreenObservationEngine | null;
};

export type RawEvolutionCandidate = {
  evolutionCategory: EvolutionCategory;
  recommendedUxImprovements: string[];
  expectedUxBenefit: string;
  evidenceReferences: string[];
  confidenceScore: number;
  impactScore: number;
  sourceEngine: string;
  sourceAdaptiveInterfaceId?: string | null;
  sourceWorkflowEvolutionId?: string | null;
  sourceProductivityIntelligenceId?: string | null;
  sourceOpportunityId?: string | null;
};
