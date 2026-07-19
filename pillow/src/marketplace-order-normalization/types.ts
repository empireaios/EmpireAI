/** PILLOW-MON-001 — Marketplace Order Normalization types (R1-13). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  NORMALIZATION_STATUSES,
  SUPPORTED_MARKETPLACE_IDENTIFIERS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { MarketplaceOrderNormalizationConfiguration } from "./configuration.js";

export type MarketplaceOrderNormalizationEngineVersion = "PILLOW-MON-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type NormalizationStatus = (typeof NORMALIZATION_STATUSES)[number];
export type SupportedMarketplaceIdentifier = (typeof SUPPORTED_MARKETPLACE_IDENTIFIERS)[number];

export type OrderLineItem = {
  itemId: string;
  sku: string | null;
  title: string;
  quantity: number;
  unitPrice: number | null;
  currency: string | null;
};

export type PricingSummary = {
  subtotal: number | null;
  tax: number | null;
  shipping: number | null;
  total: number;
  currency: string;
};

export type NormalizedOrderRecord = {
  orderId: string;
  marketplaceIdentifier: string;
  marketplaceOrderId: string;
  customerReference: string | null;
  orderStatus: string;
  orderItems: OrderLineItem[];
  itemQuantities: number[];
  pricingSummary: PricingSummary;
  currency: string;
  paymentStatus: string;
  fulfilmentStatus: string;
  shippingStatus: string | null;
  refundStatus: string | null;
  marketplaceMetadata: Record<string, unknown>;
  schemaVersion: string;
  metadataVersion: string;
  normalizationStatus: NormalizationStatus;
  normalizedAt: string;
};

export type RawMarketplaceOrderPayload = {
  marketplaceIdentifier: string;
  marketplaceOrderId: string;
  sourceData: Record<string, unknown>;
};

export type DuplicateOrderGroup = {
  groupId: string;
  matchKey: string;
  matchType: "marketplace_order_id" | "customer_reference" | "order_total";
  orders: NormalizedOrderRecord[];
};

export type MissingAttributeFinding = {
  orderId: string;
  marketplaceIdentifier: string;
  missingFields: string[];
};

export type InvalidOrderFinding = {
  marketplaceIdentifier: string;
  marketplaceOrderId: string;
  errors: string[];
};

export type OrderNormalizationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type OrderNormalizationReport = {
  normalizationReportId: string;
  normalizationTimestamp: string;
  action: "normalize" | "normalize_batch" | "detect_duplicates" | "validate";
  orders: NormalizedOrderRecord[];
  duplicates: DuplicateOrderGroup[];
  missingAttributes: MissingAttributeFinding[];
  invalidOrders: InvalidOrderFinding[];
  validation: OrderNormalizationValidationReport;
  durationMs: number;
  schemaVersion: string;
  metadataVersion: string;
};

export type OrderNormalizationHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  catalogSize: number;
  lastNormalizationAt: string | null;
  lastValidationDecision: OrderNormalizationValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  normalizationFailures: number;
  duplicatesDetected: number;
  invalidOrdersDetected: number;
  notes: string[];
};

export type OrderNormalizationPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  normalizationRuns: number;
  ordersNormalized: number;
  duplicatesDetected: number;
  invalidOrdersDetected: number;
  missingAttributeFindings: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type OrderNormalizationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type MarketplaceOrderNormalizationState = {
  engineVersion: MarketplaceOrderNormalizationEngineVersion;
  missionId: "R1-13";
  status: EngineStatus;
  initializedAt: string;
  configuration: MarketplaceOrderNormalizationConfiguration;
  latestReport: OrderNormalizationReport | null;
  catalog: NormalizedOrderRecord[];
  health: OrderNormalizationHealthReport;
  performance: OrderNormalizationPerformanceStats;
};

export type OrderNormalizationCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  catalogSize: number;
  lastNormalizationAt: string | null;
  lastDecision: OrderNormalizationValidationReport["decision"] | null;
  duplicatesDetected: number;
  invalidOrdersDetected: number;
  schemaVersion: string;
  recentLogs: string[];
};

export type NormalizeOrdersInput = {
  marketplaceIdentifier?: SupportedMarketplaceIdentifier;
  rawOrders?: RawMarketplaceOrderPayload[];
  includeFixtureCatalog?: boolean;
};

export type NormalizeOrderInput = {
  marketplaceIdentifier: SupportedMarketplaceIdentifier;
  marketplaceOrderId: string;
  sourceData: Record<string, unknown>;
};

export type DetectDuplicatesInput = {
  orders?: NormalizedOrderRecord[];
};
