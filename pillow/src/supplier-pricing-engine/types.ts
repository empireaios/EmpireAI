/** PILLOW-SPE-001 — Supplier Pricing Engine types (R2-07). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  SUPPORTED_CURRENCIES,
  SUPPORTED_SUPPLIER_IDENTIFIERS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { SupplierPricingEngineConfiguration } from "./configuration.js";

export type SupplierPricingEngineVersion = "PILLOW-SPE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type SupportedSupplierIdentifier = (typeof SUPPORTED_SUPPLIER_IDENTIFIERS)[number];
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export type SupplierPricingRecord = {
  pricingRecordId: string;
  supplierId: string;
  supplierProductId: string;
  internalProductId: string | null;
  currentSupplierPrice: number;
  previousSupplierPrice: number | null;
  currency: SupportedCurrency;
  priceChangeAmount: number | null;
  priceChangePercentage: number | null;
  landedCost: number | null;
  effectiveTimestamp: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type HistoricalPriceEntry = {
  entryId: string;
  supplierId: string;
  supplierProductId: string;
  price: number;
  currency: SupportedCurrency;
  recordedAt: string;
};

export type RawSupplierPricingPayload = {
  supplierId: string;
  supplierProductId: string;
  price: number;
  currency?: SupportedCurrency;
  sourceData?: Record<string, unknown>;
};

export type PriceChangeFinding = {
  changeId: string;
  changeType: "increase" | "decrease" | "anomaly" | "initial";
  supplierId: string;
  supplierProductId: string;
  pricingRecordId: string;
  previousPrice: number | null;
  currentPrice: number;
  priceChangeAmount: number;
  priceChangePercentage: number | null;
  details: string;
};

export type InvalidPricingFinding = {
  supplierId: string;
  supplierProductId: string;
  errors: string[];
};

export type SupplierPricingValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SupplierPricingSyncReport = {
  syncReportId: string;
  syncTimestamp: string;
  action: "sync" | "sync_batch" | "receive" | "validate";
  pricing: SupplierPricingRecord[];
  changes: PriceChangeFinding[];
  history: HistoricalPriceEntry[];
  invalidRecords: InvalidPricingFinding[];
  validation: SupplierPricingValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type SupplierPricingHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  pricingCount: number;
  lastSynchronizationAt: string | null;
  lastValidationDecision: SupplierPricingValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  synchronizationFailures: number;
  priceIncreasesDetected: number;
  priceDecreasesDetected: number;
  anomaliesDetected: number;
  invalidRecordsDetected: number;
  notes: string[];
};

export type SupplierPricingPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  synchronizationRuns: number;
  recordsSynchronized: number;
  priceIncreasesDetected: number;
  priceDecreasesDetected: number;
  anomaliesDetected: number;
  invalidRecordsDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type SupplierPricingLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type SupplierPricingEngineState = {
  engineVersion: SupplierPricingEngineVersion;
  missionId: "R2-07";
  status: EngineStatus;
  initializedAt: string;
  configuration: SupplierPricingEngineConfiguration;
  latestReport: SupplierPricingSyncReport | null;
  pricing: SupplierPricingRecord[];
  history: HistoricalPriceEntry[];
  health: SupplierPricingHealthReport;
  performance: SupplierPricingPerformanceStats;
};

export type SupplierPricingCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  pricingCount: number;
  historyCount: number;
  lastSynchronizationAt: string | null;
  lastDecision: SupplierPricingValidationReport["decision"] | null;
  priceIncreasesDetected: number;
  priceDecreasesDetected: number;
  anomaliesDetected: number;
  recentLogs: string[];
};

export type SyncSupplierPricingInput = {
  supplierId?: SupportedSupplierIdentifier;
  rawPricing?: RawSupplierPricingPayload[];
  includeFixturePricing?: boolean;
  changeFixtureMode?: "none" | "increase" | "decrease" | "anomaly";
};

export type ReceiveSupplierPricingInput = {
  supplierId: SupportedSupplierIdentifier;
  supplierProductId: string;
  price: number;
  currency?: SupportedCurrency;
  sourceData?: Record<string, unknown>;
};
