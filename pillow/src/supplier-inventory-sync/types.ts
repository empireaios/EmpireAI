/** PILLOW-SIS-001 — Supplier Inventory Sync types (R2-06). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  STOCK_AVAILABILITY_STATUSES,
  SYNCHRONIZATION_STATUSES,
  SUPPORTED_SUPPLIER_IDENTIFIERS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { SupplierInventorySyncConfiguration } from "./configuration.js";

export type SupplierInventorySyncEngineVersion = "PILLOW-SIS-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type SynchronizationStatus = (typeof SYNCHRONIZATION_STATUSES)[number];
export type StockAvailabilityStatus = (typeof STOCK_AVAILABILITY_STATUSES)[number];
export type SupportedSupplierIdentifier = (typeof SUPPORTED_SUPPLIER_IDENTIFIERS)[number];

export type SupplierInventoryRecord = {
  inventoryRecordId: string;
  supplierId: string;
  supplierProductId: string;
  internalProductId: string | null;
  currentStockQuantity: number;
  stockAvailabilityStatus: StockAvailabilityStatus;
  lastSynchronizationTimestamp: string;
  inventorySource: string;
  synchronizationStatus: SynchronizationStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type RawSupplierInventoryPayload = {
  supplierId: string;
  supplierProductId: string;
  quantity: number;
  sourceData?: Record<string, unknown>;
};

export type InventoryChangeFinding = {
  changeId: string;
  changeType: "increase" | "decrease" | "out_of_stock" | "discontinued";
  supplierId: string;
  supplierProductId: string;
  inventoryRecordId: string;
  previousQuantity: number | null;
  currentQuantity: number;
  details: string;
};

export type InvalidInventoryFinding = {
  supplierId: string;
  supplierProductId: string;
  errors: string[];
};

export type SupplierInventorySyncValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SupplierInventorySyncReport = {
  syncReportId: string;
  syncTimestamp: string;
  action: "sync" | "sync_batch" | "receive" | "detect_changes" | "validate";
  inventory: SupplierInventoryRecord[];
  changes: InventoryChangeFinding[];
  invalidRecords: InvalidInventoryFinding[];
  validation: SupplierInventorySyncValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type SupplierInventorySyncHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  inventoryCount: number;
  lastSynchronizationAt: string | null;
  lastValidationDecision: SupplierInventorySyncValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  synchronizationFailures: number;
  stockIncreasesDetected: number;
  stockDecreasesDetected: number;
  outOfStockDetected: number;
  discontinuedDetected: number;
  invalidRecordsDetected: number;
  notes: string[];
};

export type SupplierInventorySyncPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  synchronizationRuns: number;
  recordsSynchronized: number;
  stockIncreasesDetected: number;
  stockDecreasesDetected: number;
  outOfStockDetected: number;
  discontinuedDetected: number;
  invalidRecordsDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type SupplierInventorySyncLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type SupplierInventorySyncState = {
  engineVersion: SupplierInventorySyncEngineVersion;
  missionId: "R2-06";
  status: EngineStatus;
  initializedAt: string;
  configuration: SupplierInventorySyncConfiguration;
  latestReport: SupplierInventorySyncReport | null;
  inventory: SupplierInventoryRecord[];
  health: SupplierInventorySyncHealthReport;
  performance: SupplierInventorySyncPerformanceStats;
};

export type SupplierInventorySyncCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  inventoryCount: number;
  lastSynchronizationAt: string | null;
  lastDecision: SupplierInventorySyncValidationReport["decision"] | null;
  stockIncreasesDetected: number;
  stockDecreasesDetected: number;
  outOfStockDetected: number;
  discontinuedDetected: number;
  recentLogs: string[];
};

export type SyncSupplierInventoryInput = {
  supplierId?: SupportedSupplierIdentifier;
  rawInventory?: RawSupplierInventoryPayload[];
  includeFixtureInventory?: boolean;
  changeFixtureMode?: "none" | "increase" | "decrease" | "out_of_stock" | "discontinued";
};

export type ReceiveSupplierInventoryInput = {
  supplierId: SupportedSupplierIdentifier;
  supplierProductId: string;
  quantity: number;
  sourceData?: Record<string, unknown>;
};
