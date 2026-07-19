/** PILLOW-PCE-001 — Procurement Engine types (R2-09). */

import type {
  APPROVAL_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  PROCUREMENT_STATUSES,
  SUPPORTED_SUPPLIER_IDENTIFIERS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { ProcurementEngineConfiguration } from "./configuration.js";

export type ProcurementEngineVersion = "PILLOW-PCE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type ProcurementStatus = (typeof PROCUREMENT_STATUSES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
export type SupportedSupplierIdentifier = (typeof SUPPORTED_SUPPLIER_IDENTIFIERS)[number];
export type SupportedCurrency = "USD" | "CNY" | "EUR" | "GBP";

export type ProcurementRecord = {
  procurementId: string;
  timestamp: string;
  supplierId: string;
  purchaseOrderId: string | null;
  productReference: string;
  internalProductId: string | null;
  requestedQuantity: number;
  unitCost: number;
  currency: SupportedCurrency;
  procurementStatus: ProcurementStatus;
  approvalStatus: ApprovalStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type SupplierSelectionResult = {
  selectionId: string;
  selectedSupplierId: string;
  supplierProductId: string;
  rankingScore: number;
  unitCost: number;
  availableQuantity: number;
  selectionReason: string;
};

export type PurchaseOrderRecord = {
  purchaseOrderId: string;
  procurementId: string;
  supplierId: string;
  productReference: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  currency: SupportedCurrency;
  createdAt: string;
  status: "created" | "failed";
};

export type ProcurementFailureFinding = {
  procurementId: string;
  failureType: "supplier_unavailable" | "invalid_request" | "approval_rejected" | "purchase_order_failed";
  details: string;
};

export type InvalidProcurementFinding = {
  productReference: string;
  errors: string[];
};

export type ProcurementValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ProcurementReport = {
  procurementReportId: string;
  procurementTimestamp: string;
  action: "request" | "approve" | "create_order" | "track" | "validate";
  records: ProcurementRecord[];
  selection: SupplierSelectionResult | null;
  purchaseOrder: PurchaseOrderRecord | null;
  failures: ProcurementFailureFinding[];
  invalidRequests: InvalidProcurementFinding[];
  validation: ProcurementValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ProcurementHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  procurementCount: number;
  lastProcurementAt: string | null;
  lastValidationDecision: ProcurementValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  procurementFailures: number;
  purchaseOrdersCreated: number;
  approvalsPending: number;
  invalidRequestsDetected: number;
  notes: string[];
};

export type ProcurementPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  procurementRequests: number;
  purchaseOrdersCreated: number;
  approvalsGranted: number;
  approvalsRejected: number;
  supplierSelections: number;
  procurementFailures: number;
  invalidRequestsDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ProcurementLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ProcurementEngineState = {
  engineVersion: ProcurementEngineVersion;
  missionId: "R2-09";
  status: EngineStatus;
  initializedAt: string;
  configuration: ProcurementEngineConfiguration;
  latestReport: ProcurementReport | null;
  records: ProcurementRecord[];
  purchaseOrders: PurchaseOrderRecord[];
  health: ProcurementHealthReport;
  performance: ProcurementPerformanceStats;
};

export type ProcurementCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  procurementCount: number;
  purchaseOrderCount: number;
  lastProcurementAt: string | null;
  lastDecision: ProcurementValidationReport["decision"] | null;
  approvalsPending: number;
  purchaseOrdersCreated: number;
  recentLogs: string[];
};

export type CreateProcurementRequestInput = {
  productReference?: string;
  supplierProductId?: string;
  requestedQuantity?: number;
  preferredSupplierId?: SupportedSupplierIdentifier;
  includeFixtureRequest?: boolean;
};

export type ApproveProcurementInput = {
  procurementId: string;
  approved: boolean;
};
