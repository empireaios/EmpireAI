/** PILLOW-LEV-001 — Layout Evaluation types (T2-04). */

import type {
  EVALUATION_CATEGORIES,
  EVALUATION_SCOPES,
  EVALUATION_STATUSES,
  OVERALL_EVALUATION_STATUSES,
  VALIDATION_DECISIONS,
} from "./paths.js";
import type { LayoutEvaluationConfiguration } from "./configuration.js";
import type { RuleViolation } from "../ux-rule-engine/types.js";
import type { DesignSystemDeviation } from "../design-system-intelligence-engine/types.js";

export type LayoutEvaluationEngineVersion = "PILLOW-LEV-001";
export type EvaluationStatus = (typeof EVALUATION_STATUSES)[number];
export type OverallEvaluationStatus = (typeof OVERALL_EVALUATION_STATUSES)[number];
export type EvaluationScope = (typeof EVALUATION_SCOPES)[number];
export type EvaluationCategory = (typeof EVALUATION_CATEGORIES)[number];
export type ValidationDecision = (typeof VALIDATION_DECISIONS)[number];

export type LayoutFinding = {
  findingId: string;
  category: EvaluationCategory;
  kind: "strength" | "weakness";
  description: string;
  severity: "info" | "warning" | "error";
  evidenceRef: string;
  confidence: number;
};

export type ExecutivePreferenceDeviation = {
  deviationId: string;
  category: string;
  severity: "info" | "warning" | "error";
  description: string;
  expected: string;
  observed: string;
  evidenceMetadata: Record<string, unknown>;
  timestamp: string;
  metadataVersion: string;
};

export type LayoutEvaluationModel = {
  evaluationId: string;
  timestamp: string;
  screenId: string | null;
  routeOrViewId: string | null;
  sourceLayoutId: string | null;
  sourceComponentSetId: string | null;
  sourceNavigationGraphId: string | null;
  evaluationScope: EvaluationScope;
  overallEvaluationStatus: OverallEvaluationStatus;
  layoutStrengths: LayoutFinding[];
  layoutWeaknesses: LayoutFinding[];
  ruleViolations: RuleViolation[];
  designSystemDeviations: DesignSystemDeviation[];
  executivePreferenceDeviations: ExecutivePreferenceDeviation[];
  evidenceReferences: string[];
  confidenceScore: number;
  metadataVersion: string;
};

export type LayoutEvaluationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: ValidationDecision;
  evaluationsValidated: number;
  strengthsIdentified: number;
  weaknessesIdentified: number;
  ruleViolationsDetected: number;
  designSystemDeviationsDetected: number;
  executiveDeviationsDetected: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type LayoutEvaluationReport = {
  evaluationReportId: string;
  evaluationTimestamp: string;
  model: LayoutEvaluationModel;
  validation: LayoutEvaluationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type EvaluationHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  evaluationEnabled: boolean;
  evaluationsCompleted: number;
  lastEvaluationAt: string | null;
  lastValidationDecision: ValidationDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type EvaluationPerformanceStats = {
  totalEvaluations: number;
  successfulEvaluations: number;
  failedEvaluations: number;
  totalStrengthsIdentified: number;
  totalWeaknessesIdentified: number;
  totalRuleViolations: number;
  averageEvaluationDurationMs: number;
  peakEvaluationDurationMs: number;
};

export type EvaluationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type LayoutEvaluationState = {
  engineVersion: LayoutEvaluationEngineVersion;
  missionId: "T2-04";
  status: EvaluationStatus;
  initializedAt: string;
  configuration: LayoutEvaluationConfiguration;
  latestModel: LayoutEvaluationModel | null;
  latestReport: LayoutEvaluationReport | null;
  health: EvaluationHealthReport;
  performance: EvaluationPerformanceStats;
};

export type LayoutEvaluationCockpitSnapshot = {
  evaluationStatus: EvaluationStatus;
  healthStatus: string;
  lastDecision: ValidationDecision | null;
  overallStatus: OverallEvaluationStatus | null;
  strengthsCount: number;
  weaknessesCount: number;
  ruleViolationsCount: number;
  confidenceScore: number;
  totalEvaluations: number;
  recentLogs: string[];
};
