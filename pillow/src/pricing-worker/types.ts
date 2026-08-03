import type { PricingWorkerConfiguration } from "./configuration.js";
import type {
  COST_KINDS,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EVIDENCE_KINDS,
  INTEGRATION_TARGETS,
  MARKETPLACE_TARGETS,
  OPERATIONAL_STATES,
  PRW_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type CostKind = (typeof COST_KINDS)[number];
export type MarketplaceTarget = (typeof MARKETPLACE_TARGETS)[number];
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type PricingWorkerCapability = (typeof PRW_CAPABILITIES)[number];

export type EvidenceItem = {
  evidenceId: string;
  source: string;
  claim: string;
  kind: EvidenceKind;
  relatedTopic: string;
  recordedAt: string;
};

export type CostLine = {
  amount: number;
  kind: CostKind;
  currency: string;
  note: string;
};

export type CompetitorPricePoint = {
  competitorId: string;
  competitorName: string;
  price: number;
  currency: string;
  source: string;
  kind: CostKind;
};

/** Approved product + cost inputs for pricing (read-only). */
export type ApprovedProductPricingInput = {
  productId?: string | null;
  productName?: string | null;
  marketplace?: MarketplaceTarget | string | null;
  listingId?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  supplierCost?: number | null;
  supplierCostKind?: CostKind | string | null;
  shippingCost?: number | null;
  shippingCostKind?: CostKind | string | null;
  currency?: string | null;
  competitorPrices?: CompetitorPricePoint[] | null;
  evaluationId?: string | null;
  discoveryId?: string | null;
  businessMissionId?: string | null;
};

/** Machine-readable Pricing Report (Q3-09). */
export type PricingReport = {
  pricingId: string;
  timestamp: string;
  productId: string;
  productName: string;
  marketplace: MarketplaceTarget;
  listingId: string | null;
  supplierId: string | null;
  supplierName: string | null;
  supplierCost: CostLine;
  shippingCost: CostLine;
  marketplaceFees: CostLine;
  paymentFees: CostLine;
  advertisingAllocation: CostLine;
  totalLandedCost: CostLine;
  targetMargin: number;
  targetProfit: CostLine;
  competitorPricing: CompetitorPricePoint[];
  recommendedSellingPrice: number;
  pricingRationale: string;
  confidenceScore: number;
  actualCostTotal: number;
  estimatedCostTotal: number;
  currency: string;
  evaluationId: string | null;
  discoveryId: string | null;
  supportingEvidence: EvidenceItem[];
  businessMissionId: string | null;
  metadataVersion: string;
  reportVersion: string;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  workerId: string;
  neverPublishListings: true;
  neverModifySupplierCosts: true;
  neverExecutePromotions: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ310OrLater: true;
  neverPublishPricingAutomatically: true;
  preservePricingTraceability: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type PricingWorkerInput = {
  pricingId?: string | null;
  approvedProduct?: ApprovedProductPricingInput | null;
  productId?: string | null;
  productName?: string | null;
  marketplace?: MarketplaceTarget | string | null;
  listingId?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  supplierCost?: number | null;
  supplierCostKind?: CostKind | string | null;
  shippingCost?: number | null;
  shippingCostKind?: CostKind | string | null;
  currency?: string | null;
  competitorPrices?: CompetitorPricePoint[] | null;
  targetMarginPercent?: number | null;
  advertisingPercent?: number | null;
  marketplaceFeePercent?: number | null;
  paymentFeePercent?: number | null;
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
  publishListings?: boolean;
  modifySupplierCosts?: boolean;
  executePromotions?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ310OrLater?: boolean;
  publishPricing?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type PricingWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type PricingWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-PRW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: PricingWorkerCapability[];
  totalPricingReports: number;
  lastPricingId: string | null;
  lastRecommendedPrice: number | null;
  lastTargetMargin: number | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type PricingWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  pricingReports: PricingReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverPublishListings: true;
  neverModifySupplierCosts: true;
  neverExecutePromotions: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverPublishPricingAutomatically: true;
};

export type PricingWorkerRunReport = {
  pricingRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_approved_products"
    | "receive_supplier_costs"
    | "calculate_landed_cost"
    | "calculate_marketplace_fees"
    | "calculate_payment_fees"
    | "calculate_advertising"
    | "calculate_shipping"
    | "calculate_target_margin"
    | "calculate_target_profit"
    | "compare_competitors"
    | "recommend_selling_price"
    | "produce_report"
    | "submit_findings"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: PricingWorkerEngineRecord;
  catalog: PricingWorkerCatalog | null;
  pricingReports: PricingReport[];
  latestPricingReport: PricingReport | null;
  integrations: IntegrationHandshake[];
  validation: PricingWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type PricingWorkerState = {
  engineVersion: "PILLOW-PRW-001";
  missionId: "Q3-09";
  status: EngineStatus;
  initializedAt: string;
  configuration: PricingWorkerConfiguration;
  latestReport: PricingWorkerRunReport | null;
  engineRecord: PricingWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalPricingReports: number;
    lastPricingId: string | null;
    lastRecommendedPrice: number | null;
    lastTargetMargin: number | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type PricingWorkerCockpitSnapshot = {
  missionId: "Q3-09";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalPricingReports: number;
  latestPricingId: string | null;
  lastRecommendedPrice: number | null;
  lastTargetMargin: number | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverPublishListings: true;
  neverModifySupplierCosts: true;
  neverExecutePromotions: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverPublishPricingAutomatically: true;
};
