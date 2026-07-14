/** PILLOW-AMZINV-001 — Amazon Inventory Sync types (R1-05). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  STOCK_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { AmazonInventorySyncConfiguration } from "./configuration.js";

export type AmazonInventorySyncEngineVersion = "PILLOW-AMZINV-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type StockStatus = (typeof STOCK_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type AmazonInventoryRecord = {
  inventoryId: string;
  amazonSku: string;
  marketplaceId: string;
  productId: string | null;
  availableQuantity: number;
  reservedQuantity: number | null;
  fulfillableQuantity: number | null;
  stockStatus: StockStatus;
  lowStockStatus: boolean;
  outOfStockStatus: boolean;
  lastSynchronizedTimestamp: string;
  sourceApiReference: string;
  metadataVersion: string;
};

export type AmazonInventoryChangeSet = {
  stockChanges: AmazonInventoryRecord[];
  lowStockItems: AmazonInventoryRecord[];
  outOfStockItems: AmazonInventoryRecord[];
  discrepancies: AmazonInventoryDiscrepancy[];
  unchangedCount: number;
};

export type AmazonInventoryDiscrepancy = {
  discrepancyId: string;
  amazonSku: string;
  amazonQuantity: number;
  internalQuantity: number;
  delta: number;
  details: string;
};

export type AmazonInventoryValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type AmazonInventorySyncReport = {
  syncReportId: string;
  syncTimestamp: string;
  action: "sync" | "fetch" | "detect_discrepancy";
  inventory: AmazonInventoryRecord[];
  changes: AmazonInventoryChangeSet;
  validation: AmazonInventoryValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type AmazonInventoryHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  inventoryCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  discrepancyCount: number;
  lastSyncAt: string | null;
  lastValidationDecision: AmazonInventoryValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  syncFailures: number;
  notes: string[];
};

export type AmazonInventoryPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  syncRuns: number;
  itemsFetched: number;
  itemsSynced: number;
  stockChangesDetected: number;
  lowStockDetected: number;
  outOfStockDetected: number;
  discrepanciesDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type AmazonInventoryLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type AmazonInventorySyncState = {
  engineVersion: AmazonInventorySyncEngineVersion;
  missionId: "R1-05";
  status: EngineStatus;
  initializedAt: string;
  configuration: AmazonInventorySyncConfiguration;
  latestReport: AmazonInventorySyncReport | null;
  inventory: AmazonInventoryRecord[];
  health: AmazonInventoryHealthReport;
  performance: AmazonInventoryPerformanceStats;
};

export type AmazonInventoryCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  inventoryCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  discrepancyCount: number;
  lastSyncAt: string | null;
  lastDecision: AmazonInventoryValidationReport["decision"] | null;
  stockChangesDetected: number;
  recentLogs: string[];
};

export type SyncAmazonInventoryInput = {
  forceFullSync?: boolean;
  region?: "na" | "fe" | "eu";
};

export type FetchAmazonInventoryInput = {
  amazonSku: string;
  region?: "na" | "fe" | "eu";
};

export type RawAmazonInventoryPayload = {
  amazonSku: string;
  productId?: string;
  availableQuantity: number;
  reservedQuantity?: number;
  fulfillableQuantity?: number;
};
