/** PILLOW-UOD-001 — UX Opportunity Discovery types (T5-03). */

import type {
  COMPLEXITY_LEVELS,
  ENGINE_STATUSES,
  OPPORTUNITY_CATEGORIES,
  OPPORTUNITY_PRIORITIES,
  OPPORTUNITY_STATUSES,
} from "./paths.js";
import type { UxOpportunityDiscoveryConfiguration } from "./configuration.js";

export type UxOpportunityDiscoveryEngineVersion = "PILLOW-UOD-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];
export type OpportunityCategory = (typeof OPPORTUNITY_CATEGORIES)[number];
export type OpportunityPriority = (typeof OPPORTUNITY_PRIORITIES)[number];
export type ComplexityLevel = (typeof COMPLEXITY_LEVELS)[number];

export type OpportunityRecord = {
  opportunityId: string;
  timestamp: string;
  sourceAuditId: string | null;
  sourceObservationId: string | null;
  currentScreenId: string | null;
  currentRouteOrViewId: string | null;
  opportunityCategory: OpportunityCategory;
  opportunitySummary: string;
  expectedUxBenefit: string;
  estimatedImplementationComplexity: ComplexityLevel;
  priority: OpportunityPriority;
  evidenceReferences: string[];
  confidenceScore: number;
  opportunityStatus: OpportunityStatus;
  metadataVersion: string;
  discoverOnly: true;
};

export type OpportunityValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  opportunitiesValidated: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type OpportunityDiscoveryRunReport = {
  discoveryRunReportId: string;
  runTimestamp: string;
  opportunities: OpportunityRecord[];
  validation: OpportunityValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type DiscoverySessionRecord = {
  discoverySessionId: string;
  startedAt: string;
  endedAt: string | null;
  status: EngineStatus;
  discoveriesRecorded: number;
  discoveriesFailed: number;
  opportunitiesDiscovered: number;
  lastDiscoveryAt: string | null;
  lastScreenId: string | null;
  lastRouteId: string | null;
  continuousDiscoveryActive: boolean;
};

export type DiscoveryHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  discoveryEnabled: boolean;
  continuousDiscoveryActive: boolean;
  lastDiscoveryAt: string | null;
  lastValidationDecision: OpportunityValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  activeSessions: number;
  notes: string[];
};

export type DiscoveryPerformanceStats = {
  totalDiscoveries: number;
  successfulDiscoveries: number;
  failedDiscoveries: number;
  totalOpportunitiesDiscovered: number;
  layoutOpportunities: number;
  componentOpportunities: number;
  navigationOpportunities: number;
  workflowOpportunities: number;
  accessibilityOpportunities: number;
  consistencyOpportunities: number;
  duplicatesSkipped: number;
  averageDiscoveryDurationMs: number;
  peakDiscoveryDurationMs: number;
  skippedCycles: number;
};

export type UxOpportunityDiscoveryPerformanceStats = DiscoveryPerformanceStats;

export type DiscoveryLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type UxOpportunityDiscoveryState = {
  engineVersion: UxOpportunityDiscoveryEngineVersion;
  missionId: "T5-03";
  status: EngineStatus;
  initializedAt: string;
  configuration: UxOpportunityDiscoveryConfiguration;
  latestReport: OpportunityDiscoveryRunReport | null;
  activeSession: DiscoverySessionRecord | null;
  topOpportunities: OpportunityRecord[];
  health: DiscoveryHealthReport;
  performance: DiscoveryPerformanceStats;
};

export type UxOpportunityDiscoveryCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: DiscoveryHealthReport["status"];
  lastDecision: OpportunityValidationReport["decision"] | null;
  continuousDiscoveryActive: boolean;
  totalDiscoveries: number;
  totalOpportunitiesDiscovered: number;
  topPriorityCount: number;
  confidenceScore: number;
  recentLogs: string[];
};

export type UxOpportunityDiscoveryInput = {
  sessionId?: string;
  forceDiscovery?: boolean;
  auditId?: string;
};

export type UxOpportunityDiscoveryEngineBundle = {
  autonomousUxAudit: import("../autonomous-ux-audit-engine/engine.js").AutonomousUxAuditEngine | null;
  continuousScreenObservation: import("../continuous-screen-observation-engine/engine.js").ContinuousScreenObservationEngine | null;
  uxScoring: import("../ux-scoring-engine/engine.js").UxScoringEngine | null;
  recommendationEngine: import("../recommendation-engine/engine.js").RecommendationEngine | null;
  continuousCollaboration: import("../continuous-collaboration/engine.js").ContinuousCollaborationEngine | null;
  uxRuleEngine: import("../ux-rule-engine/engine.js").UxRuleEngine | null;
  designSystemIntelligence: import("../design-system-intelligence-engine/engine.js").DesignSystemIntelligenceEngine | null;
  accessibilityIntelligence: import("../accessibility-intelligence-engine/engine.js").AccessibilityIntelligenceEngine | null;
  visualConsistency: import("../visual-consistency-engine/engine.js").VisualConsistencyEngine | null;
};

export type RawOpportunityCandidate = {
  category: OpportunityCategory;
  summary: string;
  expectedBenefit: string;
  complexity: ComplexityLevel;
  evidenceReferences: string[];
  confidenceScore: number;
  impactScore: number;
  sourceEngine: string;
};
