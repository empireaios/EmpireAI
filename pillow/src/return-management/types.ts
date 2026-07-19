/** PILLOW-RM-001 — Return Management types (R2-13). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  RETURN_AUTHORIZATION_STATUSES,
  RETURN_COMPLETION_STATUSES,
  RETURN_REASONS,
  RETURN_SHIPMENT_STATUSES,
  SUPPORTED_SUPPLIER_IDENTIFIERS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { ReturnManagementConfiguration } from "./configuration.js";

export type ReturnManagementVersion = "PILLOW-RM-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type ReturnReason = (typeof RETURN_REASONS)[number];
export type ReturnAuthorizationStatus = (typeof RETURN_AUTHORIZATION_STATUSES)[number];
export type ReturnShipmentStatus = (typeof RETURN_SHIPMENT_STATUSES)[number];
export type ReturnCompletionStatus = (typeof RETURN_COMPLETION_STATUSES)[number];
export type SupportedSupplierIdentifier = (typeof SUPPORTED_SUPPLIER_IDENTIFIERS)[number];

export type ReturnRecord = {
  returnId: string;
  timestamp: string;
  orderReference: string;
  shipmentReference: string;
  customerReference: string;
  supplierReference: SupportedSupplierIdentifier;
  returnReason: ReturnReason;
  returnAuthorizationStatus: ReturnAuthorizationStatus;
  returnShipmentStatus: ReturnShipmentStatus;
  returnCompletionStatus: ReturnCompletionStatus;
  returnLabelReference: string | null;
  returnTrackingNumber: string | null;
  inventoryRestocked: boolean;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type ReturnFailureFinding = {
  returnId: string;
  failureType:
    | "invalid_request"
    | "missing_shipment"
    | "supplier_failure"
    | "carrier_failure"
    | "duplicate_request"
    | "ineligible";
  details: string;
};

export type InvalidReturnFinding = {
  returnId: string;
  errors: string[];
};

export type ReturnValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ReturnReport = {
  returnReportId: string;
  returnTimestamp: string;
  action: "create" | "authorize" | "label" | "track" | "complete" | "customer_request";
  records: ReturnRecord[];
  failures: ReturnFailureFinding[];
  invalidRecords: InvalidReturnFinding[];
  validation: ReturnValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ReturnHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  returnCount: number;
  lastOperationAt: string | null;
  lastValidationDecision: ReturnValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  returnFailures: number;
  authorizedCount: number;
  completedCount: number;
  failedCount: number;
  invalidRecordsDetected: number;
  notes: string[];
};

export type ReturnPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  returnRequestsCreated: number;
  returnsAuthorized: number;
  labelsGenerated: number;
  returnsCompleted: number;
  returnFailures: number;
  invalidRecordsDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ReturnLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ReturnManagementState = {
  engineVersion: ReturnManagementVersion;
  missionId: "R2-13";
  status: EngineStatus;
  initializedAt: string;
  configuration: ReturnManagementConfiguration;
  latestReport: ReturnReport | null;
  records: ReturnRecord[];
  health: ReturnHealthReport;
  performance: ReturnPerformanceStats;
};

export type ReturnCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  returnCount: number;
  lastOperationAt: string | null;
  lastDecision: ReturnValidationReport["decision"] | null;
  authorizedCount: number;
  completedCount: number;
  failedCount: number;
  recentLogs: string[];
};

export type CreateReturnRequestInput = {
  orderReference?: string;
  shipmentReference?: string;
  customerReference?: string;
  supplierReference?: SupportedSupplierIdentifier;
  returnReason?: ReturnReason;
  includeFixtureReturn?: boolean;
};

export type ReceiveCustomerReturnRequestInput = {
  orderReference: string;
  customerReference: string;
  returnReason: ReturnReason;
  shipmentReference?: string;
};

export type TrackReturnLifecycleInput = {
  returnId: string;
  returnFixtureMode?: "none" | "in_transit" | "received" | "failed";
};
