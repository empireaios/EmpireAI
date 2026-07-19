/** PILLOW-SRM-001 — Supplier Risk Monitor types (R2-16). */

import type {
  AVAILABILITY_STATUSES,
  ENGINE_STATUSES,
  FULFILMENT_RELIABILITY_STATUSES,
  HEALTH_STATUSES,
  STABILITY_STATUSES,
  SUPPORTED_SUPPLIER_IDENTIFIERS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { SupplierRiskMonitorConfiguration } from "./configuration.js";

export type SupplierRiskMonitorVersion = "PILLOW-SRM-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type SupportedSupplierIdentifier = (typeof SUPPORTED_SUPPLIER_IDENTIFIERS)[number];
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];
export type StabilityStatus = (typeof STABILITY_STATUSES)[number];
export type FulfilmentReliabilityStatus = (typeof FULFILMENT_RELIABILITY_STATUSES)[number];

export type SupplierRiskRecord = {
  supplierRiskId: string;
  timestamp: string;
  supplierId: SupportedSupplierIdentifier;
  supplierHealthScore: number;
  riskScore: number;
  availabilityStatus: AvailabilityStatus;
  inventoryStability: StabilityStatus;
  pricingStability: StabilityStatus;
  fulfilmentReliability: FulfilmentReliabilityStatus;
  activeRiskAlerts: string[];
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type SupplierRiskFailureFinding = {
  supplierRiskId: string;
  failureType:
    | "missing_supplier"
    | "monitoring_failure"
    | "invalid_metrics"
    | "risk_calculation_failure"
    | "communication_failure";
  details: string;
};

export type InvalidSupplierRiskFinding = {
  supplierId: string;
  errors: string[];
};

export type SupplierRiskValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SupplierRiskReport = {
  riskReportId: string;
  riskTimestamp: string;
  action: "monitor" | "analyze" | "score" | "alert" | "validate";
  records: SupplierRiskRecord[];
  failures: SupplierRiskFailureFinding[];
  invalidRecords: InvalidSupplierRiskFinding[];
  validation: SupplierRiskValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type SupplierRiskHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  supplierCount: number;
  lastMonitorAt: string | null;
  lastValidationDecision: SupplierRiskValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  monitoringFailures: number;
  highRiskCount: number;
  disruptionCount: number;
  alertsGenerated: number;
  invalidRecordsDetected: number;
  notes: string[];
};

export type SupplierRiskPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  monitorRuns: number;
  suppliersMonitored: number;
  riskScoresCalculated: number;
  alertsGenerated: number;
  disruptionsDetected: number;
  abnormalBehaviourDetected: number;
  monitoringFailures: number;
  invalidRecordsDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type SupplierRiskLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type SupplierRiskMonitorState = {
  engineVersion: SupplierRiskMonitorVersion;
  missionId: "R2-16";
  status: EngineStatus;
  initializedAt: string;
  configuration: SupplierRiskMonitorConfiguration;
  latestReport: SupplierRiskReport | null;
  records: SupplierRiskRecord[];
  health: SupplierRiskHealthReport;
  performance: SupplierRiskPerformanceStats;
};

export type SupplierRiskCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  supplierCount: number;
  lastMonitorAt: string | null;
  lastDecision: SupplierRiskValidationReport["decision"] | null;
  highRiskCount: number;
  disruptionCount: number;
  alertsGenerated: number;
  recentLogs: string[];
};

export type MonitorSupplierHealthInput = {
  supplierId?: SupportedSupplierIdentifier;
  includeFixtureSuppliers?: boolean;
  riskFixtureMode?: "none" | "healthy" | "elevated" | "disrupted" | "abnormal";
};
