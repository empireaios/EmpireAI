/** PILLOW-SSE-001 — Supplier Scale Engine types (X3-06). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  SSE_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { SupplierScaleEngineConfiguration } from "./configuration.js";

export type SupplierScaleEngineVersion = "PILLOW-SSE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type SseCapability = (typeof SSE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type SupplierScalingRecord = {
  supplierScalingId: string;
  timestamp: string;
  companyReference: string;
  supplierReference: string;
  capacityScore: number;
  performanceScore: number;
  reliabilityScore: number;
  fulfilmentReadiness: number;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  neverRecommendSupplierExpansionWithoutValidatedCapacity: true;
  structuralSignalOnly: true;
  sensitiveSupplierData: false;
};

export type SupplierScaleEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: SseCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    autonomousScalingFramework: boolean;
    winningProductDetector: boolean;
    scalingDecisionEngine: boolean;
    capacityPlanningEngine: boolean;
    marketingScaleEngine: boolean;
  };
  metadataVersion: string;
};

export type SupplierRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  supplierReference: string;
  recommendationSummary: string;
  capacityScore: number;
  performanceScore: number;
  reliabilityScore: number;
  fulfilmentReadiness: number;
  structuralSignalOnly: true;
  neverRecommendSupplierExpansionWithoutValidatedCapacity: true;
};

export type SupplierValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SseRunReport = {
  supplierScaleRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "monitor_capacity"
    | "monitor_performance"
    | "monitor_lead_times"
    | "monitor_inventory"
    | "monitor_fulfilment"
    | "monitor_reliability"
    | "detect_bottlenecks"
    | "detect_scaling_risks"
    | "recommend_expansion"
    | "diagnostics";
  engineRecord: SupplierScaleEngineRecord;
  scalingRecords: SupplierScalingRecord[];
  recommendations: SupplierRecommendation[];
  validation: SupplierValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type SseHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: SupplierValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalScalingRecords: number;
  bottleneckCount: number;
  averageReadiness: number;
  notes: string[];
};

export type SsePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  monitoringRuns: number;
  scalingRisksDetected: number;
  bottlenecksDetected: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type SupplierScaleEngineState = {
  engineVersion: SupplierScaleEngineVersion;
  missionId: "X3-06";
  status: EngineStatus;
  initializedAt: string;
  configuration: SupplierScaleEngineConfiguration;
  latestReport: SseRunReport | null;
  engineRecord: SupplierScaleEngineRecord | null;
  health: SseHealthReport;
  performance: SsePerformanceStats;
};

export type SseCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: SupplierValidationReport["decision"] | null;
  totalScalingRecords: number;
  bottleneckCount: number;
  averageReadiness: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type SseLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectSupplierScaleEngineInput = Record<string, unknown>;

export type SupplierScaleInput = {
  companyReference?: string;
  supplierReference?: string;
  capacityHint?: number;
  performanceHint?: number;
  reliabilityHint?: number;
  fulfilmentHint?: number;
  leadTimeHint?: number;
  inventoryHint?: number;
  validated?: boolean;
};

export type RunSseDiagnosticsInput = Record<string, unknown>;
