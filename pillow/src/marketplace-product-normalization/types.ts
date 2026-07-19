/** PILLOW-MPN-001 — Marketplace Product Normalization types (R1-12). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  NORMALIZATION_STATUSES,
  SUPPORTED_MARKETPLACE_IDENTIFIERS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { MarketplaceProductNormalizationConfiguration } from "./configuration.js";

export type MarketplaceProductNormalizationEngineVersion = "PILLOW-MPN-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type NormalizationStatus = (typeof NORMALIZATION_STATUSES)[number];
export type SupportedMarketplaceIdentifier = (typeof SUPPORTED_MARKETPLACE_IDENTIFIERS)[number];

export type ProductVariant = {
  variantId: string;
  sku: string | null;
  title: string | null;
  price: number | null;
  currency: string | null;
  attributes: Record<string, string> | null;
};

export type NormalizedProductRecord = {
  productId: string;
  marketplaceIdentifier: string;
  marketplaceProductId: string;
  sku: string | null;
  productTitle: string;
  productDescription: string | null;
  productCategory: string | null;
  productBrand: string | null;
  productImages: string[] | null;
  productAttributes: Record<string, string> | null;
  productVariants: ProductVariant[] | null;
  price: number | null;
  currency: string | null;
  inventoryReference: string | null;
  marketplaceMetadata: Record<string, unknown>;
  schemaVersion: string;
  metadataVersion: string;
  normalizationStatus: NormalizationStatus;
  normalizedAt: string;
};

export type RawMarketplaceProductPayload = {
  marketplaceIdentifier: string;
  marketplaceProductId: string;
  sourceData: Record<string, unknown>;
};

export type DuplicateProductGroup = {
  groupId: string;
  matchKey: string;
  matchType: "sku" | "marketplace_product_id" | "title_brand";
  products: NormalizedProductRecord[];
};

export type MissingAttributeFinding = {
  productId: string;
  marketplaceIdentifier: string;
  missingFields: string[];
};

export type InvalidProductFinding = {
  marketplaceIdentifier: string;
  marketplaceProductId: string;
  errors: string[];
};

export type ProductNormalizationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ProductNormalizationReport = {
  normalizationReportId: string;
  normalizationTimestamp: string;
  action: "normalize" | "normalize_batch" | "detect_duplicates" | "validate";
  products: NormalizedProductRecord[];
  duplicates: DuplicateProductGroup[];
  missingAttributes: MissingAttributeFinding[];
  invalidProducts: InvalidProductFinding[];
  validation: ProductNormalizationValidationReport;
  durationMs: number;
  schemaVersion: string;
  metadataVersion: string;
};

export type ProductNormalizationHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  catalogSize: number;
  lastNormalizationAt: string | null;
  lastValidationDecision: ProductNormalizationValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  normalizationFailures: number;
  duplicatesDetected: number;
  invalidProductsDetected: number;
  notes: string[];
};

export type ProductNormalizationPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  normalizationRuns: number;
  productsNormalized: number;
  duplicatesDetected: number;
  invalidProductsDetected: number;
  missingAttributeFindings: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ProductNormalizationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type MarketplaceProductNormalizationState = {
  engineVersion: MarketplaceProductNormalizationEngineVersion;
  missionId: "R1-12";
  status: EngineStatus;
  initializedAt: string;
  configuration: MarketplaceProductNormalizationConfiguration;
  latestReport: ProductNormalizationReport | null;
  catalog: NormalizedProductRecord[];
  health: ProductNormalizationHealthReport;
  performance: ProductNormalizationPerformanceStats;
};

export type ProductNormalizationCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  catalogSize: number;
  lastNormalizationAt: string | null;
  lastDecision: ProductNormalizationValidationReport["decision"] | null;
  duplicatesDetected: number;
  invalidProductsDetected: number;
  schemaVersion: string;
  recentLogs: string[];
};

export type NormalizeProductsInput = {
  marketplaceIdentifier?: SupportedMarketplaceIdentifier;
  rawProducts?: RawMarketplaceProductPayload[];
  includeFixtureCatalog?: boolean;
};

export type NormalizeProductInput = {
  marketplaceIdentifier: SupportedMarketplaceIdentifier;
  marketplaceProductId: string;
  sourceData: Record<string, unknown>;
};

export type DetectDuplicatesInput = {
  products?: NormalizedProductRecord[];
};
