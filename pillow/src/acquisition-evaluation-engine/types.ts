/** PILLOW-AEE-001 — Acquisition Evaluation Engine types (X2-15). */

import type {
  AEE_CAPABILITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  RECOMMENDATION_TYPES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { AcquisitionEvaluationEngineConfiguration } from "./configuration.js";

export type AcquisitionEvaluationEngineVersion = "PILLOW-AEE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type AeeCapability = (typeof AEE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type RecommendationType = (typeof RECOMMENDATION_TYPES)[number];

export type AcquisitionEvaluationEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: AeeCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    enterprisePortfolioFramework: boolean;
    portfolioPerformanceEngine: boolean;
    capitalDistributionEngine: boolean;
    portfolioRiskEngine: boolean;
    businessHealthRanking: boolean;
    sharedSupplierIntelligence: boolean;
    portfolioForecastEngine: boolean;
  };
  metadataVersion: string;
};

export type AcquisitionRecord = {
  acquisitionEvaluationId: string;
  timestamp: string;
  candidateBusiness: string;
  industry: string;
  strategicFitScore: number;
  financialScore: number;
  riskScore: number;
  operationalMaturityScore: number;
  estimatedAcquisitionValue: number;
  recommendation: RecommendationType;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  rankedPosition: number | null;
  validatedInformationOnly: true;
  structuralSignalOnly: true;
  sensitiveEnterpriseData: false;
};

export type AcquisitionRecommendation = {
  recommendationId: string;
  timestamp: string;
  candidateBusiness: string;
  recommendationType: RecommendationType;
  rationale: string;
  priority: "low" | "medium" | "high";
  validatedInformationOnly: true;
  structuralSignalOnly: true;
};

export type AcquisitionValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type AcquisitionRunReport = {
  acquisitionRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "discover_candidates"
    | "evaluate_opportunity"
    | "evaluate_strategic_fit"
    | "evaluate_financial"
    | "evaluate_operational_maturity"
    | "evaluate_risks"
    | "estimate_value"
    | "rank_opportunities"
    | "generate_recommendations"
    | "diagnostics";
  engineRecord: AcquisitionEvaluationEngineRecord;
  acquisitionRecords: AcquisitionRecord[];
  recommendations: AcquisitionRecommendation[];
  validation: AcquisitionValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type AcquisitionHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: AcquisitionValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalAcquisitionRecords: number;
  pursueRecommendations: number;
  averageStrategicFit: number;
  notes: string[];
};

export type AcquisitionPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  candidatesDiscovered: number;
  opportunitiesEvaluated: number;
  strategicEvaluations: number;
  financialEvaluations: number;
  operationalEvaluations: number;
  riskEvaluations: number;
  valueEstimations: number;
  rankingsRun: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type AcquisitionLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type AcquisitionEvaluationEngineState = {
  engineVersion: AcquisitionEvaluationEngineVersion;
  missionId: "X2-15";
  status: EngineStatus;
  initializedAt: string;
  configuration: AcquisitionEvaluationEngineConfiguration;
  latestReport: AcquisitionRunReport | null;
  engineRecord: AcquisitionEvaluationEngineRecord | null;
  health: AcquisitionHealthReport;
  performance: AcquisitionPerformanceStats;
};

export type AcquisitionCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: AcquisitionValidationReport["decision"] | null;
  totalAcquisitionRecords: number;
  pursueRecommendations: number;
  averageStrategicFit: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectAcquisitionEvaluationEngineInput = {
  forceReconnect?: boolean;
};

export type DiscoverAcquisitionCandidatesInput = {
  industryHints?: string[];
  candidateBusinesses?: string[];
  validated?: boolean;
};

export type EvaluateAcquisitionInput = {
  candidateBusiness: string;
  industry?: string;
  strategicFitHint?: number;
  financialHint?: number;
  riskHint?: number;
  operationalMaturityHint?: number;
  estimatedValueHint?: number;
  validated?: boolean;
};

export type RankAcquisitionOpportunitiesInput = {
  validated?: boolean;
};

export type GenerateAcquisitionRecommendationsInput = {
  candidateBusiness?: string;
  validated?: boolean;
};

export type RunAcquisitionDiagnosticsInput = {
  candidateBusiness?: string;
};
