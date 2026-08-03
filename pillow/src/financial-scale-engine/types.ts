/** PILLOW-FSE-001 — Financial Scale Engine types (X3-07). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  FSE_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { FinancialScaleEngineConfiguration } from "./configuration.js";

export type FinancialScaleEngineVersion = "PILLOW-FSE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type FseCapability = (typeof FSE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type FinancialScalingRecord = {
  financialScalingId: string;
  timestamp: string;
  companyReference: string;
  scalingInitiativeReference: string;
  capitalRequirement: number;
  cashFlowReadiness: number;
  profitabilityScore: number;
  investmentEfficiencyScore: number;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  neverRecommendScalingWithoutValidatedFinancialReadiness: true;
  structuralSignalOnly: true;
  sensitiveFinancialData: false;
};

export type FinancialScaleEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: FseCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    autonomousScalingFramework: boolean;
    winningProductDetector: boolean;
    scalingDecisionEngine: boolean;
    capacityPlanningEngine: boolean;
    marketingScaleEngine: boolean;
    supplierScaleEngine: boolean;
  };
  metadataVersion: string;
};

export type FinancialRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  scalingInitiativeReference: string;
  recommendationSummary: string;
  capitalRequirement: number;
  cashFlowReadiness: number;
  profitabilityScore: number;
  investmentEfficiencyScore: number;
  structuralSignalOnly: true;
  neverRecommendScalingWithoutValidatedFinancialReadiness: true;
};

export type FinancialValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type FseRunReport = {
  financialScaleRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "monitor_capital_requirements"
    | "monitor_cash_flow_readiness"
    | "monitor_profitability"
    | "monitor_working_capital"
    | "monitor_operating_expenses"
    | "monitor_investment_efficiency"
    | "detect_financial_bottlenecks"
    | "detect_capital_shortages"
    | "recommend_financial_scaling"
    | "diagnostics";
  engineRecord: FinancialScaleEngineRecord;
  scalingRecords: FinancialScalingRecord[];
  recommendations: FinancialRecommendation[];
  validation: FinancialValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type FseHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: FinancialValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalScalingRecords: number;
  bottleneckCount: number;
  averageReadiness: number;
  notes: string[];
};

export type FsePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  monitoringRuns: number;
  capitalShortagesDetected: number;
  bottlenecksDetected: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type FinancialScaleEngineState = {
  engineVersion: FinancialScaleEngineVersion;
  missionId: "X3-07";
  status: EngineStatus;
  initializedAt: string;
  configuration: FinancialScaleEngineConfiguration;
  latestReport: FseRunReport | null;
  engineRecord: FinancialScaleEngineRecord | null;
  health: FseHealthReport;
  performance: FsePerformanceStats;
};

export type FseCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: FinancialValidationReport["decision"] | null;
  totalScalingRecords: number;
  bottleneckCount: number;
  averageReadiness: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type FseLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectFinancialScaleEngineInput = Record<string, unknown>;

export type FinancialScaleInput = {
  companyReference?: string;
  scalingInitiativeReference?: string;
  capitalHint?: number;
  cashFlowHint?: number;
  profitabilityHint?: number;
  investmentEfficiencyHint?: number;
  workingCapitalHint?: number;
  operatingExpenseHint?: number;
  validated?: boolean;
};

export type RunFseDiagnosticsInput = Record<string, unknown>;
