/** PILLOW-LME-001 — Launch Monitoring Engine types (X1-13). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  LME_CAPABILITIES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { LaunchMonitoringEngineConfiguration } from "./configuration.js";

export type LaunchMonitoringEngineVersion = "PILLOW-LME-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type LmeCapability = (typeof LME_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type LaunchMonitoringEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: LmeCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    companyFactoryFramework: boolean;
    businessLaunchOrchestrator: boolean;
    growthInitializationEngine: boolean;
  };
  metadataVersion: string;
};

export type LaunchMonitoringRecord = {
  launchMonitoringId: string;
  timestamp: string;
  companyReference: string;
  launchReference: string;
  growthPlanReference: string;
  operationalHealthScore: number;
  salesSummary: string;
  customerActivitySummary: string;
  orderActivitySummary: string;
  systemStabilitySummary: string;
  detectedIssues: string;
  anomalySummary: string;
  healthRecommendations: string;
  monitoringFingerprint: string;
  structuralSignalOnly: true;
  modifiedProductionOperationsWithoutValidation: false;
  fabricatedMonitoringFacts: false;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type LaunchMonitoringValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type LaunchMonitoringRunReport = {
  launchMonitoringRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "monitor_launch"
    | "monitor_operational_health"
    | "monitor_customer_activity"
    | "monitor_sales_performance"
    | "monitor_order_activity"
    | "monitor_system_stability"
    | "detect_launch_anomalies"
    | "detect_operational_failures"
    | "generate_launch_health_recommendations";
  engineRecord: LaunchMonitoringEngineRecord;
  monitoringRecords: LaunchMonitoringRecord[];
  validation: LaunchMonitoringValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type LaunchMonitoringHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: LaunchMonitoringValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalMonitoringRecords: number;
  notes: string[];
};

export type LaunchMonitoringPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  monitoringRuns: number;
  operationalRuns: number;
  salesRuns: number;
  customerRuns: number;
  anomalyRuns: number;
  recommendationRuns: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type LaunchMonitoringLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type LaunchMonitoringEngineState = {
  engineVersion: LaunchMonitoringEngineVersion;
  missionId: "X1-13";
  status: EngineStatus;
  initializedAt: string;
  configuration: LaunchMonitoringEngineConfiguration;
  latestReport: LaunchMonitoringRunReport | null;
  engineRecord: LaunchMonitoringEngineRecord | null;
  health: LaunchMonitoringHealthReport;
  performance: LaunchMonitoringPerformanceStats;
};

export type LaunchMonitoringCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: LaunchMonitoringValidationReport["decision"] | null;
  totalMonitoringRecords: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectLaunchMonitoringEngineInput = {
  forceReconnect?: boolean;
};

export type MonitorLaunchInput = {
  companyReference?: string;
  launchReference?: string;
  growthPlanReference?: string;
  industry?: string;
  validated?: boolean;
};

export type LaunchMonitoringActionInput = {
  launchMonitoringId?: string;
  companyReference?: string;
  launchReference?: string;
  growthPlanReference?: string;
  industry?: string;
  validated?: boolean;
};
