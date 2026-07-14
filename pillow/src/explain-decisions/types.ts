/** PILLOW-ED-001 — Explain Decisions types (T4-06). */

import type {
  EXPLANATION_DECISIONS,
  EXPLANATION_DETAIL_LEVELS,
  EXPLANATION_STATUSES,
  EXPLANATION_TYPES,
  ENGINE_STATUSES,
} from "./paths.js";
import type { ExplainDecisionsConfiguration } from "./configuration.js";

export type ExplainDecisionsEngineVersion = "PILLOW-ED-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ExplanationStatus = (typeof EXPLANATION_STATUSES)[number];
export type ExplanationType = (typeof EXPLANATION_TYPES)[number];
export type ExplanationDecision = (typeof EXPLANATION_DECISIONS)[number];
export type ExplanationDetailLevel = (typeof EXPLANATION_DETAIL_LEVELS)[number];

export type EvidenceReference = {
  evidenceId: string;
  evidenceType: string;
  sourceId: string | null;
  summary: string;
  strength: "strong" | "moderate" | "weak" | "missing";
};

export type ExplanationRecord = {
  explanationId: string;
  timestamp: string;
  sessionId: string;
  explanationType: ExplanationType;
  sourceProposalIds: string[];
  sourceComparisonId: string | null;
  sourceUxFindingIds: string[];
  sourceUxScoreIds: string[];
  sourceRecommendationIds: string[];
  targetScreenId: string | null;
  targetRouteOrViewId: string | null;
  designRationale: string;
  uxBenefitSummary: string;
  tradeoffSummary: string;
  evidenceReferences: EvidenceReference[];
  accessibilityRationale: string | null;
  consistencyRationale: string | null;
  workflowRationale: string | null;
  executivePreferenceRationale: string | null;
  weakEvidenceNotes: string[];
  confidenceScore: number;
  explanationStatus: ExplanationStatus;
  metadataVersion: string;
};

export type ExplanationSession = {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  explanations: ExplanationRecord[];
  status: ExplanationStatus;
};

export type ExplanationRunValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: ExplanationDecision;
  explanationsProcessed: number;
  evidenceLinked: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ExplanationRunReport = {
  explanationRunReportId: string;
  runTimestamp: string;
  session: ExplanationSession;
  explanation: ExplanationRecord;
  validation: ExplanationRunValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ExplanationHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  explanationEnabled: boolean;
  explanationsCompleted: number;
  lastExplanationAt: string | null;
  lastExplanationDecision: ExplanationDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  activeSessions: number;
  notes: string[];
};

export type ExplanationPerformanceStats = {
  totalExplanations: number;
  successfulExplanations: number;
  failedExplanations: number;
  evidenceLinked: number;
  tradeoffsAnalyzed: number;
  weakEvidenceWarnings: number;
  averageExplanationDurationMs: number;
  peakExplanationDurationMs: number;
};

export type ExplanationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ExplainDecisionsState = {
  engineVersion: ExplainDecisionsEngineVersion;
  missionId: "T4-06";
  status: EngineStatus;
  initializedAt: string;
  configuration: ExplainDecisionsConfiguration;
  latestReport: ExplanationRunReport | null;
  health: ExplanationHealthReport;
  performance: ExplanationPerformanceStats;
};

export type ExplainDecisionsCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: ExplanationHealthReport["status"];
  lastDecision: ExplanationDecision | null;
  activeSessions: number;
  totalExplanations: number;
  evidenceLinked: number;
  confidenceScore: number;
  weakEvidenceWarnings: number;
  recentLogs: string[];
};

/** Input for an explain decisions run. */
export type ExplanationInput = {
  sessionId?: string;
  explanationType: ExplanationType;
  proposalIds?: string[];
  comparisonId?: string | null;
  targetProposalId?: string | null;
};
