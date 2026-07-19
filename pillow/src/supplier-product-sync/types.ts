/** PILLOW-SPS-001 — Supplier Product Sync types (R2-05). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  PRODUCT_STATUSES,
  SYNCHRONIZATION_STATUSES,
  SUPPORTED_SUPPLIER_IDENTIFIERS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { SupplierProductSyncConfiguration } from "./configuration.js";

export type SupplierProductSyncEngineVersion = "PILLOW-SPS-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type SynchronizationStatus = (typeof SYNCHRONIZATION_STATUSES)[number];
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
export type SupportedSupplierIdentifier = (typeof SUPPORTED_SUPPLIER_IDENTIFIERS)[number];

export type SupplierProductRecord = {
  productId: string;
  supplierId: string;
  supplierProductId: string;
  sku: string | null;
  productTitle: string;
  productDescription: string | null;
  productCategory: string | null;
  productImages: string[] | null;
  productAttributes: Record<string, string> | null;
  productStatus: ProductStatus;
  synchronizationStatus: SynchronizationStatus;
  supplierMetadata: Record<string, unknown>;
  metadataVersion: string;
  synchronizedAt: string;
};

export type RawSupplierProductPayload = {
  supplierId: string;
  supplierProductId: string;
  sourceData: Record<string, unknown>;
};

export type ProductChangeFinding = {
  changeId: string;
  changeType: "new" | "updated" | "discontinued";
  supplierId: string;
  supplierProductId: string;
  productId: string;
  details: string;
};

export type DuplicateProductGroup = {
  groupId: string;
  matchKey: string;
  matchType: "sku" | "supplier_product_id" | "title_category";
  products: SupplierProductRecord[];
};

export type MissingAttributeFinding = {
  productId: string;
  supplierId: string;
  missingFields: string[];
};

export type InvalidProductFinding = {
  supplierId: string;
  supplierProductId: string;
  errors: string[];
};

export type SupplierProductSyncValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SupplierProductSyncReport = {
  syncReportId: string;
  syncTimestamp: string;
  action: "sync" | "sync_batch" | "receive" | "detect_changes" | "detect_duplicates" | "validate";
  products: SupplierProductRecord[];
  changes: ProductChangeFinding[];
  duplicates: DuplicateProductGroup[];
  missingAttributes: MissingAttributeFinding[];
  invalidProducts: InvalidProductFinding[];
  validation: SupplierProductSyncValidationReport;
  durationMs: number;
  catalogVersion: string;
  metadataVersion: string;
};

export type SupplierProductSyncHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  catalogSize: number;
  lastSynchronizationAt: string | null;
  lastValidationDecision: SupplierProductSyncValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  synchronizationFailures: number;
  newProductsDetected: number;
  updatedProductsDetected: number;
  discontinuedProductsDetected: number;
  duplicatesDetected: number;
  invalidProductsDetected: number;
  notes: string[];
};

export type SupplierProductSyncPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  synchronizationRuns: number;
  productsSynchronized: number;
  newProductsDetected: number;
  updatedProductsDetected: number;
  discontinuedProductsDetected: number;
  duplicatesDetected: number;
  invalidProductsDetected: number;
  missingAttributeFindings: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type SupplierProductSyncLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type SupplierProductSyncState = {
  engineVersion: SupplierProductSyncEngineVersion;
  missionId: "R2-05";
  status: EngineStatus;
  initializedAt: string;
  configuration: SupplierProductSyncConfiguration;
  latestReport: SupplierProductSyncReport | null;
  catalog: SupplierProductRecord[];
  health: SupplierProductSyncHealthReport;
  performance: SupplierProductSyncPerformanceStats;
};

export type SupplierProductSyncCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  catalogSize: number;
  lastSynchronizationAt: string | null;
  lastDecision: SupplierProductSyncValidationReport["decision"] | null;
  newProductsDetected: number;
  updatedProductsDetected: number;
  discontinuedProductsDetected: number;
  duplicatesDetected: number;
  invalidProductsDetected: number;
  catalogVersion: string;
  recentLogs: string[];
};

export type SyncSupplierProductsInput = {
  supplierId?: SupportedSupplierIdentifier;
  rawProducts?: RawSupplierProductPayload[];
  includeFixtureCatalog?: boolean;
  changeFixtureMode?: "none" | "updated" | "discontinued" | "new";
};

export type ReceiveSupplierProductInput = {
  supplierId: SupportedSupplierIdentifier;
  supplierProductId: string;
  sourceData: Record<string, unknown>;
};

export type DetectDuplicatesInput = {
  products?: SupplierProductRecord[];
};

export type DetectProductChangesInput = {
  previousCatalog?: SupplierProductRecord[];
  nextCatalog?: SupplierProductRecord[];
};
