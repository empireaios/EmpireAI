/** PILLOW-PPE-001 — Performance Preservation Engine types (X3-12). */

import type {
  PRESERVATION_OPERATIONS,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  PPE_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { PerformancePreservationEngineConfiguration } from "./configuration.js";

export type PerformancePreservationEngineVersion = "PILLOW-PPE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type PreservationOperation = (typeof PRESERVATION_OPERATIONS)[number];
export type PpeCapability = (typeof PPE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type PreservationRecord = {
  performancePreservationId: string;
  timestamp: string;
  companyReference: string;
  operationalComponent: string;
  performanceScore: number;
  qualityScore: number;
  customerExperienceScore: number;
  detectedDegradation: boolean;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  neverCompromiseCustomerExperienceForScaling: true;
  structuralSignalOnly: true;
  sensitiveOperationalData: false;
};

export type PerformancePreservationEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: PpeCapability[];
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
  };
  metadataVersion: string;
};

export type PreservationRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  operationalComponent: string;
  recommendationSummary: string;
  performanceScore: number;
  qualityScore: number;
  customerExperienceScore: number;
  structuralSignalOnly: true;
  neverCompromiseCustomerExperienceForScaling: true;
};

export type PreservationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type PpeRunReport = {
  performancePreservationEngineRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "monitor_service_quality"
    | "monitor_customer_experience"
    | "monitor_operational_performance"
    | "monitor_response_times"
    | "monitor_fulfilment_quality"
    | "monitor_reliability"
    | "detect_performance_degradation"
    | "detect_quality_regressions"
    | "recommend_preservation_actions"
    | "diagnostics";
  engineRecord: PerformancePreservationEngineRecord;
  preservationRecords: PreservationRecord[];
  recommendations: PreservationRecommendation[];
  validation: PreservationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type PpeHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: PreservationValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalPreservationRecords: number;
  degradationCount: number;
  averageQualityScore: number;
  notes: string[];
};

export type PpePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  monitoringRuns: number;
  degradationDetected: number;
  qualityRegressionsDetected: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type PerformancePreservationEngineState = {
  engineVersion: PerformancePreservationEngineVersion;
  missionId: "X3-12";
  status: EngineStatus;
  initializedAt: string;
  configuration: PerformancePreservationEngineConfiguration;
  latestReport: PpeRunReport | null;
  engineRecord: PerformancePreservationEngineRecord | null;
  health: PpeHealthReport;
  performance: PpePerformanceStats;
};

export type PpeCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: PreservationValidationReport["decision"] | null;
  totalPreservationRecords: number;
  degradationCount: number;
  averageQualityScore: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type PpeLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectPerformancePreservationEngineInput = Record<string, unknown>;

export type PerformancePreservationInput = {
  companyReference?: string;
  operationalComponent?: string;
  performanceHint?: number;
  qualityHint?: number;
  customerExperienceHint?: number;
  responseTimeHint?: number;
  reliabilityHint?: number;
  validated?: boolean;
};

export type RunPpeDiagnosticsInput = Record<string, unknown>;
