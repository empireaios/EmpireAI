/** PILLOW-CLM-001 — Company Lifecycle Manager types (X2-17). */

import type {
  CLM_CAPABILITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  LIFECYCLE_STAGES,
  LIFECYCLE_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { CompanyLifecycleManagerConfiguration } from "./configuration.js";

export type CompanyLifecycleManagerVersion = "PILLOW-CLM-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ClmCapability = (typeof CLM_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];
export type LifecycleStatus = (typeof LIFECYCLE_STATUSES)[number];

export type CompanyLifecycleEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: ClmCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    enterprisePortfolioFramework: boolean;
    multiCompanyRegistry: boolean;
    portfolioPerformanceEngine: boolean;
    businessHealthRanking: boolean;
    portfolioForecastEngine: boolean;
    portfolioOptimizationEngine: boolean;
  };
  metadataVersion: string;
};

export type LifecycleRecord = {
  lifecycleRecordId: string;
  timestamp: string;
  companyReference: string;
  currentLifecycleStage: LifecycleStage;
  previousLifecycleStage: LifecycleStage | null;
  maturityScore: number;
  transitionRecommendation: string;
  lifecycleStatus: LifecycleStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  requiresApproval: boolean;
  autoTransitionBlocked: true;
  structuralSignalOnly: true;
  sensitiveEnterpriseData: false;
};

export type LifecycleRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  fromStage: LifecycleStage;
  toStage: LifecycleStage | null;
  rationale: string;
  priority: "low" | "medium" | "high";
  requiresApproval: boolean;
  autoTransitionBlocked: true;
  structuralSignalOnly: true;
};

export type LifecycleValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type LifecycleRunReport = {
  lifecycleRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "manage_stage"
    | "assess_maturity"
    | "detect_transitions"
    | "manage_launch"
    | "manage_growth"
    | "manage_mature"
    | "manage_retirement"
    | "generate_recommendations"
    | "run_analytics"
    | "diagnostics";
  engineRecord: CompanyLifecycleEngineRecord;
  lifecycleRecords: LifecycleRecord[];
  recommendations: LifecycleRecommendation[];
  validation: LifecycleValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type LifecycleHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: LifecycleValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalLifecycleRecords: number;
  pendingTransitions: number;
  averageMaturityScore: number;
  notes: string[];
};

export type LifecyclePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  stageManagementOps: number;
  maturityAssessments: number;
  transitionsDetected: number;
  launchOps: number;
  growthOps: number;
  matureOps: number;
  retirementOps: number;
  recommendationsGenerated: number;
  analyticsRuns: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type LifecycleLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type CompanyLifecycleManagerState = {
  engineVersion: CompanyLifecycleManagerVersion;
  missionId: "X2-17";
  status: EngineStatus;
  initializedAt: string;
  configuration: CompanyLifecycleManagerConfiguration;
  latestReport: LifecycleRunReport | null;
  engineRecord: CompanyLifecycleEngineRecord | null;
  health: LifecycleHealthReport;
  performance: LifecyclePerformanceStats;
};

export type LifecycleCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: LifecycleValidationReport["decision"] | null;
  totalLifecycleRecords: number;
  pendingTransitions: number;
  averageMaturityScore: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectCompanyLifecycleManagerInput = {
  forceReconnect?: boolean;
};

export type ManageLifecycleStageInput = {
  companyReference: string;
  lifecycleStage?: LifecycleStage;
  maturityHint?: number;
  validated?: boolean;
};

export type AssessMaturityInput = {
  companyReference: string;
  maturityHint?: number;
  validated?: boolean;
};

export type DetectTransitionsInput = {
  companyReference?: string;
  validated?: boolean;
};

export type ManageStageActionInput = {
  companyReference: string;
  maturityHint?: number;
  validated?: boolean;
};

export type GenerateLifecycleRecommendationsInput = {
  companyReference?: string;
  validated?: boolean;
};

export type RunLifecycleAnalyticsInput = {
  companyReference?: string;
  validated?: boolean;
};

export type RunLifecycleDiagnosticsInput = {
  companyReference?: string;
};
