/** PILLOW-FSM-001 — Fulfilment SLA Monitor types (R2-18). */

import type {
  COMPLIANCE_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  SLA_ALERT_TYPES,
  SUPPORTED_CARRIER_IDENTIFIERS,
  SUPPORTED_SUPPLIER_IDENTIFIERS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { FulfilmentSlaMonitorConfiguration } from "./configuration.js";

export type FulfilmentSlaMonitorVersion = "PILLOW-FSM-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];
export type SupportedSupplierIdentifier = (typeof SUPPORTED_SUPPLIER_IDENTIFIERS)[number];
export type SupportedCarrierIdentifier = (typeof SUPPORTED_CARRIER_IDENTIFIERS)[number];
export type SlaAlertType = (typeof SLA_ALERT_TYPES)[number];

export type SlaRecord = {
  slaRecordId: string;
  timestamp: string;
  orderReference: string;
  shipmentReference: string;
  supplierReference: SupportedSupplierIdentifier | string;
  carrierReference: SupportedCarrierIdentifier | string;
  slaTarget: number;
  actualFulfilmentTime: number;
  complianceStatus: ComplianceStatus;
  complianceScore: number;
  activeAlerts: string[];
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type SlaHistoryEntry = {
  historyId: string;
  slaRecordId: string;
  orderReference: string;
  complianceStatus: ComplianceStatus;
  complianceScore: number;
  recordedAt: string;
};

export type SlaFailureFinding = {
  slaRecordId: string;
  failureType:
    | "missing_fulfilment"
    | "missing_shipment"
    | "invalid_sla"
    | "monitoring_failure"
    | "alert_failure";
  details: string;
};

export type InvalidSlaFinding = {
  orderReference: string;
  errors: string[];
};

export type SlaValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SlaReport = {
  slaReportId: string;
  slaTimestamp: string;
  action: "monitor" | "comply" | "alert" | "validate";
  records: SlaRecord[];
  history: SlaHistoryEntry[];
  failures: SlaFailureFinding[];
  invalidRecords: InvalidSlaFinding[];
  validation: SlaValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type SlaHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  slaRecordCount: number;
  lastMonitorAt: string | null;
  lastValidationDecision: SlaValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  monitoringFailures: number;
  breachCount: number;
  riskCount: number;
  alertsGenerated: number;
  invalidRecordsDetected: number;
  notes: string[];
};

export type SlaPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  monitorRuns: number;
  ordersMonitored: number;
  complianceScoresCalculated: number;
  breachesDetected: number;
  risksDetected: number;
  alertsGenerated: number;
  monitoringFailures: number;
  invalidRecordsDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type SlaLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type FulfilmentSlaMonitorState = {
  engineVersion: FulfilmentSlaMonitorVersion;
  missionId: "R2-18";
  status: EngineStatus;
  initializedAt: string;
  configuration: FulfilmentSlaMonitorConfiguration;
  latestReport: SlaReport | null;
  records: SlaRecord[];
  history: SlaHistoryEntry[];
  health: SlaHealthReport;
  performance: SlaPerformanceStats;
};

export type SlaCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  slaRecordCount: number;
  lastMonitorAt: string | null;
  lastDecision: SlaValidationReport["decision"] | null;
  breachCount: number;
  riskCount: number;
  alertsGenerated: number;
  recentLogs: string[];
};

export type MonitorFulfilmentSlaInput = {
  orderReference?: string;
  includeFixtureOrders?: boolean;
  slaFixtureMode?: "none" | "compliant" | "at_risk" | "breached";
};
