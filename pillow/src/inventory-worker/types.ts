import type { InventoryWorkerConfiguration } from "./configuration.js";
import type {
  ALERT_SEVERITIES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EVIDENCE_KINDS,
  INTEGRATION_TARGETS,
  INW_CAPABILITIES,
  OPERATIONAL_STATES,
  STOCK_STATUSES,
  SUPPLIER_AVAILABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type StockStatus = (typeof STOCK_STATUSES)[number];
export type SupplierAvailability = (typeof SUPPLIER_AVAILABILITIES)[number];
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type InventoryWorkerCapability = (typeof INW_CAPABILITIES)[number];

export type EvidenceItem = {
  evidenceId: string;
  source: string;
  claim: string;
  kind: EvidenceKind;
  relatedTopic: string;
  recordedAt: string;
};

export type InventoryAlert = {
  alertId: string;
  severity: AlertSeverity;
  code: string;
  message: string;
  detectedAt: string;
};

/** Approved product + inventory inputs for monitoring (read-only). */
export type ApprovedProductInventoryInput = {
  productId?: string | null;
  productName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  currentStock?: number | null;
  previousStock?: number | null;
  supplierStockAvailable?: number | null;
  leadTimeDays?: number | null;
  dailyDemand?: number | null;
  safetyStockDays?: number | null;
  supplierAvailability?: SupplierAvailability | string | null;
  evaluationId?: string | null;
  discoveryId?: string | null;
  businessMissionId?: string | null;
};

/** Machine-readable Inventory Report (Q3-10). */
export type InventoryReport = {
  inventoryReportId: string;
  timestamp: string;
  productId: string;
  productName: string;
  supplierId: string | null;
  supplierName: string | null;
  currentStock: number;
  previousStock: number | null;
  stockStatus: StockStatus;
  leadTimeDays: number;
  reorderPoint: number;
  reorderQuantity: number;
  dailyDemandAssumption: number;
  safetyStock: number;
  supplierAvailability: SupplierAvailability;
  supplierStockAvailable: number | null;
  inventoryAlerts: InventoryAlert[];
  recommendedAction: string;
  confidenceScore: number;
  abnormalChangeDetected: boolean;
  stockDelta: number | null;
  evaluationId: string | null;
  discoveryId: string | null;
  businessMissionId: string | null;
  supportingEvidence: EvidenceItem[];
  metadataVersion: string;
  reportVersion: string;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  workerId: string;
  neverPurchaseInventory: true;
  neverModifySupplierStock: true;
  neverPlaceSupplierOrders: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ311OrLater: true;
  neverModifySupplierInventoryDirectly: true;
  preserveInventoryTraceability: true;
  preserveSupplierReferences: true;
  preserveInventoryHistory: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type InventoryWorkerInput = {
  inventoryReportId?: string | null;
  approvedProduct?: ApprovedProductInventoryInput | null;
  productId?: string | null;
  productName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  currentStock?: number | null;
  previousStock?: number | null;
  supplierStockAvailable?: number | null;
  leadTimeDays?: number | null;
  dailyDemand?: number | null;
  safetyStockDays?: number | null;
  supplierAvailability?: SupplierAvailability | string | null;
  evaluationId?: string | null;
  discoveryId?: string | null;
  businessMissionId?: string | null;
  evidenceSources?: Array<{
    source?: string | null;
    claim?: string | null;
    kind?: EvidenceKind | string | null;
    relatedTopic?: string | null;
  }> | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  purchaseInventory?: boolean;
  modifySupplierStock?: boolean;
  placeSupplierOrders?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ311OrLater?: boolean;
  modifySupplierInventory?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type InventoryWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type InventoryWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-INW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: InventoryWorkerCapability[];
  totalInventoryReports: number;
  lastInventoryReportId: string | null;
  lastStockStatus: StockStatus | null;
  lastReorderPoint: number | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type InventoryWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  inventoryReports: InventoryReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverPurchaseInventory: true;
  neverModifySupplierStock: true;
  neverPlaceSupplierOrders: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverModifySupplierInventoryDirectly: true;
};

export type InventoryWorkerRunReport = {
  inventoryRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_approved_products"
    | "monitor_supplier_stock"
    | "monitor_inventory_quantities"
    | "monitor_lead_times"
    | "monitor_supplier_availability"
    | "calculate_reorder_points"
    | "detect_low_stock"
    | "detect_out_of_stock"
    | "detect_abnormal_changes"
    | "generate_alerts"
    | "produce_report"
    | "submit_findings"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: InventoryWorkerEngineRecord;
  catalog: InventoryWorkerCatalog | null;
  inventoryReports: InventoryReport[];
  latestInventoryReport: InventoryReport | null;
  integrations: IntegrationHandshake[];
  validation: InventoryWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type InventoryWorkerState = {
  engineVersion: "PILLOW-INW-001";
  missionId: "Q3-10";
  status: EngineStatus;
  initializedAt: string;
  configuration: InventoryWorkerConfiguration;
  latestReport: InventoryWorkerRunReport | null;
  engineRecord: InventoryWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalInventoryReports: number;
    lastInventoryReportId: string | null;
    lastStockStatus: StockStatus | null;
    lastReorderPoint: number | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type InventoryWorkerCockpitSnapshot = {
  missionId: "Q3-10";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalInventoryReports: number;
  latestInventoryReportId: string | null;
  lastStockStatus: StockStatus | null;
  lastReorderPoint: number | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverPurchaseInventory: true;
  neverModifySupplierStock: true;
  neverPlaceSupplierOrders: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverModifySupplierInventoryDirectly: true;
};
