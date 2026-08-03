/** PILLOW-SRM-001 — Scaling Risk Monitor types (X3-13). */

import type {
  RISK_OPERATIONS,
  RISK_CATEGORIES,
  RISK_SEVERITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  SRM_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { ScalingRiskMonitorConfiguration } from "./configuration.js";

export type ScalingRiskMonitorVersion = "PILLOW-SRM-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type RiskOperation = (typeof RISK_OPERATIONS)[number];
export type RiskCategory = (typeof RISK_CATEGORIES)[number];
export type RiskSeverity = (typeof RISK_SEVERITIES)[number];
export type SrmCapability = (typeof SRM_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type ScalingRiskRecord = {
  scalingRiskId: string;
  timestamp: string;
  companyReference: string;
  riskCategory: RiskCategory;
  riskSeverity: RiskSeverity;
  riskProbability: number;
  businessImpact: string;
  mitigationRecommendation: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  neverSuppressCriticalScalingRisks: true;
  structuralSignalOnly: true;
  sensitiveOperationalData: false;
};

export type ScalingRiskMonitorRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: SrmCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    autonomousScalingFramework: boolean;
    winningProductDetector: boolean;
    scalingDecisionEngine: boolean;
    capacityPlanningEngine: boolean;
    marketingScaleEngine: boolean;
    supplierScaleEngine: boolean;
    financialScaleEngine: boolean;
    workforceIntelligence: boolean;
    executiveScalingDashboard: boolean;
    bottleneckIntelligence: boolean;
    operationalElasticityEngine: boolean;
    performancePreservationEngine: boolean;
  };
  metadataVersion: string;
};

export type RiskMitigationRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  riskCategory: RiskCategory;
  recommendationSummary: string;
  riskSeverity: RiskSeverity;
  riskProbability: number;
  structuralSignalOnly: true;
  neverSuppressCriticalScalingRisks: true;
};

export type ScalingRiskValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SrmRunReport = {
  scalingRiskMonitorRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "monitor_scaling_risks"
    | "monitor_operational_risks"
    | "monitor_financial_risks"
    | "monitor_supplier_risks"
    | "monitor_marketing_risks"
    | "monitor_workforce_risks"
    | "monitor_infrastructure_risks"
    | "detect_uncontrolled_expansion"
    | "rank_scaling_risks"
    | "recommend_risk_mitigations"
    | "diagnostics";
  engineRecord: ScalingRiskMonitorRecord;
  scalingRiskRecords: ScalingRiskRecord[];
  recommendations: RiskMitigationRecommendation[];
  validation: ScalingRiskValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type SrmHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: ScalingRiskValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalScalingRiskRecords: number;
  criticalRiskCount: number;
  averageRiskProbability: number;
  notes: string[];
};

export type SrmPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  monitoringRuns: number;
  uncontrolledExpansionDetected: number;
  criticalRisksDetected: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ScalingRiskMonitorState = {
  engineVersion: ScalingRiskMonitorVersion;
  missionId: "X3-13";
  status: EngineStatus;
  initializedAt: string;
  configuration: ScalingRiskMonitorConfiguration;
  latestReport: SrmRunReport | null;
  engineRecord: ScalingRiskMonitorRecord | null;
  health: SrmHealthReport;
  performance: SrmPerformanceStats;
};

export type SrmCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: ScalingRiskValidationReport["decision"] | null;
  totalScalingRiskRecords: number;
  criticalRiskCount: number;
  averageRiskProbability: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type SrmLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectScalingRiskMonitorInput = Record<string, unknown>;

export type ScalingRiskInput = {
  companyReference?: string;
  riskCategoryHint?: RiskCategory;
  riskProbabilityHint?: number;
  riskSeverityHint?: RiskSeverity;
  expansionPressureHint?: number;
  validated?: boolean;
};

export type RunSrmDiagnosticsInput = Record<string, unknown>;
