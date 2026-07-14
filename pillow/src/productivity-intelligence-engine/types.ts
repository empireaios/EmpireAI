/** PILLOW-PIE-001 — Productivity Intelligence types (T5-04). */

import type {
  ENGINE_STATUSES,
  PRODUCTIVITY_CATEGORIES,
  PRODUCTIVITY_STATUSES,
} from "./paths.js";
import type { ProductivityIntelligenceConfiguration } from "./configuration.js";

export type ProductivityIntelligenceEngineVersion = "PILLOW-PIE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ProductivityStatus = (typeof PRODUCTIVITY_STATUSES)[number];
export type ProductivityCategory = (typeof PRODUCTIVITY_CATEGORIES)[number];

export type ProductivityIntelligenceRecord = {
  productivityId: string;
  timestamp: string;
  sourceObservationId: string | null;
  sourceAuditId: string | null;
  sourceOpportunityId: string | null;
  sessionId: string;
  currentScreenId: string | null;
  currentRouteOrViewId: string | null;
  workflowPatternSummary: string;
  navigationPatternSummary: string;
  taskSequenceSummary: string;
  bottleneckSummary: string;
  productivityObservations: ProductivityCategory[];
  evidenceReferences: string[];
  confidenceScore: number;
  status: ProductivityStatus;
  metadataVersion: string;
  learnOnly: true;
};

export type ProductivityValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  recordsValidated: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ProductivityLearningRunReport = {
  learningRunReportId: string;
  runTimestamp: string;
  records: ProductivityIntelligenceRecord[];
  validation: ProductivityValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type LearningSessionRecord = {
  learningSessionId: string;
  startedAt: string;
  endedAt: string | null;
  status: EngineStatus;
  learningCyclesRecorded: number;
  learningCyclesFailed: number;
  patternsLearned: number;
  lastLearningAt: string | null;
  lastScreenId: string | null;
  lastRouteId: string | null;
  continuousLearningActive: boolean;
};

export type ProductivityHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  learningEnabled: boolean;
  continuousLearningActive: boolean;
  lastLearningAt: string | null;
  lastValidationDecision: ProductivityValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  activeSessions: number;
  notes: string[];
};

export type ProductivityPerformanceStats = {
  totalLearningCycles: number;
  successfulLearningCycles: number;
  failedLearningCycles: number;
  totalPatternsLearned: number;
  workflowPatterns: number;
  navigationPatterns: number;
  bottleneckPatterns: number;
  repetitionPatterns: number;
  trendPatterns: number;
  duplicatesSkipped: number;
  averageLearningDurationMs: number;
  peakLearningDurationMs: number;
  skippedCycles: number;
};

export type ProductivityLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ProductivityIntelligenceState = {
  engineVersion: ProductivityIntelligenceEngineVersion;
  missionId: "T5-04";
  status: EngineStatus;
  initializedAt: string;
  configuration: ProductivityIntelligenceConfiguration;
  latestReport: ProductivityLearningRunReport | null;
  activeSession: LearningSessionRecord | null;
  topPatterns: ProductivityIntelligenceRecord[];
  health: ProductivityHealthReport;
  performance: ProductivityPerformanceStats;
};

export type ProductivityIntelligenceCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: ProductivityHealthReport["status"];
  lastDecision: ProductivityValidationReport["decision"] | null;
  continuousLearningActive: boolean;
  totalLearningCycles: number;
  totalPatternsLearned: number;
  topConfidenceScore: number;
  recentLogs: string[];
};

export type ProductivityIntelligenceInput = {
  sessionId?: string;
  forceLearning?: boolean;
  opportunityId?: string;
};

export type ProductivityIntelligenceEngineBundle = {
  uxOpportunityDiscovery: import("../ux-opportunity-discovery-engine/engine.js").UxOpportunityDiscoveryEngine | null;
  autonomousUxAudit: import("../autonomous-ux-audit-engine/engine.js").AutonomousUxAuditEngine | null;
  continuousScreenObservation: import("../continuous-screen-observation-engine/engine.js").ContinuousScreenObservationEngine | null;
  interactionTracking: import("../interaction-tracking-engine/engine.js").InteractionTrackingEngine | null;
  contextAwareness: import("../context-awareness-engine/engine.js").ContextAwarenessEngine | null;
  workflowOptimization: import("../workflow-optimization-engine/engine.js").WorkflowOptimizationEngine | null;
  uxScoring: import("../ux-scoring-engine/engine.js").UxScoringEngine | null;
  continuousCollaboration: import("../continuous-collaboration/engine.js").ContinuousCollaborationEngine | null;
};

export type RawProductivityCandidate = {
  productivityObservations: ProductivityCategory[];
  workflowPatternSummary: string;
  navigationPatternSummary: string;
  taskSequenceSummary: string;
  bottleneckSummary: string;
  evidenceReferences: string[];
  confidenceScore: number;
  impactScore: number;
  sourceEngine: string;
  sourceOpportunityId?: string | null;
  sourceAuditId?: string | null;
  sourceObservationId?: string | null;
};
