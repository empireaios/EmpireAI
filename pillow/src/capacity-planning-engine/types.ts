/** PILLOW-CPE-001 — Capacity Planning Engine types (X3-04). */

import type {
  CAPACITY_DOMAINS,
  CPE_CAPABILITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { CapacityPlanningEngineConfiguration } from "./configuration.js";

export type CapacityPlanningEngineVersion = "PILLOW-CPE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type CpeCapability = (typeof CPE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type CapacityDomain = (typeof CAPACITY_DOMAINS)[number];

export type CapacityPlanningRecord = {
  capacityPlanningId: string;
  timestamp: string;
  companyReference: string;
  productReference: string;
  domain: CapacityDomain;
  currentCapacity: number;
  forecastDemand: number;
  capacityUtilization: number;
  bottleneckSummary: string;
  recommendedExpansion: number;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  neverRecommendBeyondValidatedLimits: true;
  structuralSignalOnly: true;
  sensitiveOperationalData: false;
};

export type CapacityPlanningEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CpeCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    autonomousScalingFramework: boolean;
    winningProductDetector: boolean;
    scalingDecisionEngine: boolean;
  };
  metadataVersion: string;
};

export type CapacityRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  productReference: string;
  domain: CapacityDomain;
  recommendationSummary: string;
  recommendedExpansion: number;
  capacityUtilization: number;
  structuralSignalOnly: true;
  neverRecommendBeyondValidatedLimits: true;
};

export type CapacityValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CpeRunReport = {
  capacityPlanningRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "monitor_operational"
    | "monitor_infrastructure"
    | "monitor_supplier"
    | "monitor_fulfilment"
    | "monitor_inventory"
    | "monitor_workforce"
    | "forecast"
    | "detect_bottlenecks"
    | "recommend_expansion"
    | "diagnostics";
  engineRecord: CapacityPlanningEngineRecord;
  planningRecords: CapacityPlanningRecord[];
  recommendations: CapacityRecommendation[];
  validation: CapacityValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CpeHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: CapacityValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalPlanningRecords: number;
  bottleneckCount: number;
  averageUtilization: number;
  notes: string[];
};

export type CpePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  monitoringRuns: number;
  forecastsRun: number;
  bottlenecksDetected: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type CapacityPlanningEngineState = {
  engineVersion: CapacityPlanningEngineVersion;
  missionId: "X3-04";
  status: EngineStatus;
  initializedAt: string;
  configuration: CapacityPlanningEngineConfiguration;
  latestReport: CpeRunReport | null;
  engineRecord: CapacityPlanningEngineRecord | null;
  health: CpeHealthReport;
  performance: CpePerformanceStats;
};

export type CpeCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: CapacityValidationReport["decision"] | null;
  totalPlanningRecords: number;
  bottleneckCount: number;
  averageUtilization: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type CpeLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectCapacityPlanningEngineInput = Record<string, unknown>;

export type CapacityPlanningInput = {
  companyReference?: string;
  productReference?: string;
  domain?: CapacityDomain;
  currentCapacityHint?: number;
  forecastDemandHint?: number;
  utilizationHint?: number;
  validated?: boolean;
};

export type RunCpeDiagnosticsInput = Record<string, unknown>;
