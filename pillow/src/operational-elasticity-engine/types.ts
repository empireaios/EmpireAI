/** PILLOW-OEE-001 — Operational Elasticity Engine types (X3-11). */

import type {
  ELASTICITY_OPERATIONS,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  OEE_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { OperationalElasticityEngineConfiguration } from "./configuration.js";

export type OperationalElasticityEngineVersion = "PILLOW-OEE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ElasticityOperation = (typeof ELASTICITY_OPERATIONS)[number];
export type OeeCapability = (typeof OEE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type ElasticityRecord = {
  elasticityRecordId: string;
  timestamp: string;
  companyReference: string;
  operationalComponent: string;
  currentUtilization: number;
  targetUtilization: number;
  scalingAdjustment: number;
  resourceAllocationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  neverExceedValidatedOperationalLimits: true;
  structuralSignalOnly: true;
  sensitiveOperationalData: false;
};

export type OperationalElasticityEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: OeeCapability[];
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
  };
  metadataVersion: string;
};

export type ElasticityRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  operationalComponent: string;
  recommendationSummary: string;
  currentUtilization: number;
  targetUtilization: number;
  scalingAdjustment: number;
  structuralSignalOnly: true;
  neverExceedValidatedOperationalLimits: true;
};

export type ElasticityValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type OeeRunReport = {
  operationalElasticityEngineRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "monitor_operational_demand"
    | "monitor_operational_utilization"
    | "scale_capacity_upward"
    | "scale_capacity_downward"
    | "balance_workloads_dynamically"
    | "optimize_resource_utilization"
    | "detect_overcapacity"
    | "detect_undercapacity"
    | "recommend_elasticity_actions"
    | "diagnostics";
  engineRecord: OperationalElasticityEngineRecord;
  elasticityRecords: ElasticityRecord[];
  recommendations: ElasticityRecommendation[];
  validation: ElasticityValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type OeeHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: ElasticityValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalElasticityRecords: number;
  highUtilizationCount: number;
  averageUtilization: number;
  notes: string[];
};

export type OeePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  monitoringRuns: number;
  capacityAdjustments: number;
  overcapacityDetected: number;
  undercapacityDetected: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type OperationalElasticityEngineState = {
  engineVersion: OperationalElasticityEngineVersion;
  missionId: "X3-11";
  status: EngineStatus;
  initializedAt: string;
  configuration: OperationalElasticityEngineConfiguration;
  latestReport: OeeRunReport | null;
  engineRecord: OperationalElasticityEngineRecord | null;
  health: OeeHealthReport;
  performance: OeePerformanceStats;
};

export type OeeCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: ElasticityValidationReport["decision"] | null;
  totalElasticityRecords: number;
  highUtilizationCount: number;
  averageUtilization: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type OeeLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectOperationalElasticityEngineInput = Record<string, unknown>;

export type OperationalElasticityInput = {
  companyReference?: string;
  operationalComponent?: string;
  utilizationHint?: number;
  targetUtilizationHint?: number;
  demandHint?: number;
  capacityHint?: number;
  validated?: boolean;
};

export type RunOeeDiagnosticsInput = Record<string, unknown>;
