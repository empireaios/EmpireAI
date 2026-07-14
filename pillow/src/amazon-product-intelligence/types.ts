/** PILLOW-AMZPI-001 — Amazon Product Intelligence types (R1-03). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  PRODUCT_STATUSES,
  SYNCHRONIZATION_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { AmazonProductIntelligenceConfiguration } from "./configuration.js";

export type AmazonProductIntelligenceEngineVersion = "PILLOW-AMZPI-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
export type SynchronizationStatus = (typeof SYNCHRONIZATION_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type AmazonProductRecord = {
  productId: string;
  amazonAsin: string;
  amazonSku: string | null;
  marketplaceId: string;
  productTitle: string;
  productDescription: string | null;
  productCategory: string | null;
  productImages: string[] | null;
  productAttributes: Record<string, string> | null;
  productStatus: ProductStatus;
  synchronizationStatus: SynchronizationStatus;
  sourceApiReference: string;
  metadataVersion: string;
  lastSyncedAt: string;
};

export type AmazonProductChangeSet = {
  newProducts: AmazonProductRecord[];
  updatedProducts: AmazonProductRecord[];
  inactiveProducts: AmazonProductRecord[];
  unchangedCount: number;
};

export type AmazonProductValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type AmazonProductSyncReport = {
  syncReportId: string;
  syncTimestamp: string;
  action: "sync" | "fetch" | "detect_changes" | "validate";
  products: AmazonProductRecord[];
  changes: AmazonProductChangeSet;
  validation: AmazonProductValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type AmazonProductHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  catalogSize: number;
  lastSyncAt: string | null;
  lastValidationDecision: AmazonProductValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  syncFailures: number;
  notes: string[];
};

export type AmazonProductPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  syncRuns: number;
  productsFetched: number;
  productsSynced: number;
  newProductsDetected: number;
  updatedProductsDetected: number;
  inactiveProductsDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type AmazonProductLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type AmazonProductIntelligenceState = {
  engineVersion: AmazonProductIntelligenceEngineVersion;
  missionId: "R1-03";
  status: EngineStatus;
  initializedAt: string;
  configuration: AmazonProductIntelligenceConfiguration;
  latestReport: AmazonProductSyncReport | null;
  catalog: AmazonProductRecord[];
  health: AmazonProductHealthReport;
  performance: AmazonProductPerformanceStats;
};

export type AmazonProductCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  catalogSize: number;
  lastSyncAt: string | null;
  lastDecision: AmazonProductValidationReport["decision"] | null;
  newProductsDetected: number;
  updatedProductsDetected: number;
  inactiveProductsDetected: number;
  recentLogs: string[];
};

export type SyncAmazonProductsInput = {
  forceFullSync?: boolean;
  region?: "na" | "fe" | "eu";
};

export type FetchAmazonProductInput = {
  asin: string;
  region?: "na" | "fe" | "eu";
};

export type RawAmazonProductPayload = {
  asin: string;
  sku?: string;
  title: string;
  description?: string;
  category?: string;
  images?: string[];
  attributes?: Record<string, string>;
  status?: ProductStatus;
};
