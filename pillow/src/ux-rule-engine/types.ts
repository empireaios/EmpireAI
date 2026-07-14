/** PILLOW-URE-001 — UX Rule Engine types (T2-01). */

import type {
  RULE_CATEGORIES,
  RULE_ENGINE_STATUSES,
  RULE_SEVERITIES,
  RULE_STATUSES,
  RULE_TARGET_TYPES,
  VALIDATION_DECISIONS,
} from "./paths.js";
import type { UxRuleEngineConfiguration } from "./configuration.js";

export type UxRuleEngineVersion = "PILLOW-URE-001";
export type RuleEngineStatus = (typeof RULE_ENGINE_STATUSES)[number];
export type RuleSeverity = (typeof RULE_SEVERITIES)[number];
export type RuleStatus = (typeof RULE_STATUSES)[number];
export type RuleTargetType = (typeof RULE_TARGET_TYPES)[number];
export type RuleCategory = (typeof RULE_CATEGORIES)[number];
export type ValidationDecision = (typeof VALIDATION_DECISIONS)[number];

export type RuleEvaluationLogic = {
  evaluator: string;
  parameters: Record<string, unknown>;
};

export type UxRule = {
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  description: string;
  severity: RuleSeverity;
  status: RuleStatus;
  version: string;
  targetType: RuleTargetType;
  evaluationLogic: RuleEvaluationLogic;
  ruleConfiguration: Record<string, unknown>;
  createdTimestamp: string;
  updatedTimestamp: string;
  metadataVersion: string;
};

export type RuleViolation = {
  violationId: string;
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  severity: RuleSeverity;
  sourceUiStateId: string | null;
  sourceComponentId: string | null;
  sourceLayoutId: string | null;
  sourceNavigationNodeId: string | null;
  affectedScreenId: string | null;
  affectedRouteOrView: string | null;
  violationDescription: string;
  evidenceMetadata: Record<string, unknown>;
  timestamp: string;
  metadataVersion: string;
};

export type RuleEvaluationResult = {
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  severity: RuleSeverity;
  targetType: RuleTargetType;
  passed: boolean;
  skipped: boolean;
  skipReason: string | null;
  violation: RuleViolation | null;
  durationMs: number;
};

export type RuleValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: ValidationDecision;
  totalRules: number;
  rulesEvaluated: number;
  rulesPassed: number;
  rulesFailed: number;
  rulesSkipped: number;
  results: RuleEvaluationResult[];
  violations: RuleViolation[];
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type RuleEngineHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  engineEnabled: boolean;
  rulesLoaded: number;
  rulesEnabled: number;
  lastValidationAt: string | null;
  lastValidationDecision: ValidationDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type RuleEnginePerformanceStats = {
  totalValidations: number;
  successfulValidations: number;
  failedValidations: number;
  totalRulesEvaluated: number;
  totalViolations: number;
  averageValidationDurationMs: number;
  peakValidationDurationMs: number;
};

export type RuleEngineLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type UxRuleEngineState = {
  engineVersion: UxRuleEngineVersion;
  missionId: "T2-01";
  status: RuleEngineStatus;
  initializedAt: string;
  configuration: UxRuleEngineConfiguration;
  rulesLoaded: number;
  rulesEnabled: number;
  latestReport: RuleValidationReport | null;
  health: RuleEngineHealthReport;
  performance: RuleEnginePerformanceStats;
};

export type UxRuleEngineCockpitSnapshot = {
  engineStatus: RuleEngineStatus;
  healthStatus: string;
  rulesLoaded: number;
  rulesEnabled: number;
  lastDecision: ValidationDecision | null;
  violationsCount: number;
  totalValidations: number;
  recentLogs: string[];
};
