/** PILLOW-SDE-001 — Scaling Decision Engine types (X3-03). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  SCALING_DECISIONS,
  SDE_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { ScalingDecisionEngineConfiguration } from "./configuration.js";

export type ScalingDecisionEngineVersion = "PILLOW-SDE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type SdeCapability = (typeof SDE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ScalingDecisionOutcome = (typeof SCALING_DECISIONS)[number];

export type ScalingDecisionRecord = {
  scalingDecisionId: string;
  timestamp: string;
  companyReference: string;
  productReference: string;
  readinessScore: number;
  riskScore: number;
  scalingConfidence: number;
  decision: ScalingDecisionOutcome;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  opportunityRanking: number;
  productReadiness: number;
  operationalReadiness: number;
  financialReadiness: number;
  supplierReadiness: number;
  marketReadiness: number;
  neverApproveWithoutValidation: true;
  structuralSignalOnly: true;
  sensitiveOperationalData: false;
};

export type ScalingDecisionEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: SdeCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    autonomousScalingFramework: boolean;
    winningProductDetector: boolean;
  };
  metadataVersion: string;
};

export type ScalingRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  productReference: string;
  recommendationSummary: string;
  decision: ScalingDecisionOutcome;
  scalingConfidence: number;
  structuralSignalOnly: true;
  neverApproveWithoutValidation: true;
};

export type DecisionValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SdeRunReport = {
  scalingDecisionRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "evaluate_candidate"
    | "assess_readiness"
    | "assess_risk"
    | "decide_scale"
    | "rank_priorities"
    | "generate_recommendations"
    | "diagnostics";
  engineRecord: ScalingDecisionEngineRecord;
  decisionRecords: ScalingDecisionRecord[];
  recommendations: ScalingRecommendation[];
  validation: DecisionValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type SdeHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: DecisionValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalDecisionRecords: number;
  scaleCount: number;
  holdCount: number;
  rejectCount: number;
  averageConfidence: number;
  notes: string[];
};

export type SdePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  candidateEvaluations: number;
  readinessAssessments: number;
  riskAssessments: number;
  decisionsProduced: number;
  rankingsRun: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ScalingDecisionEngineState = {
  engineVersion: ScalingDecisionEngineVersion;
  missionId: "X3-03";
  status: EngineStatus;
  initializedAt: string;
  configuration: ScalingDecisionEngineConfiguration;
  latestReport: SdeRunReport | null;
  engineRecord: ScalingDecisionEngineRecord | null;
  health: SdeHealthReport;
  performance: SdePerformanceStats;
};

export type SdeCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: DecisionValidationReport["decision"] | null;
  totalDecisionRecords: number;
  scaleCount: number;
  holdCount: number;
  rejectCount: number;
  averageConfidence: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type SdeLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectScalingDecisionEngineInput = Record<string, unknown>;

export type ScalingDecisionInput = {
  companyReference?: string;
  productReference?: string;
  productReadinessHint?: number;
  operationalReadinessHint?: number;
  financialReadinessHint?: number;
  supplierReadinessHint?: number;
  marketReadinessHint?: number;
  riskHint?: number;
  validated?: boolean;
};

export type RunSdeDiagnosticsInput = Record<string, unknown>;
