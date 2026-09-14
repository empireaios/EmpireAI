/**
 * Synthetic Amazon US commerce foundation V1 — types only.
 * No live marketplace / payment / fulfilment side effects.
 */

export const SYNTHETIC_MARKETPLACE = "amazon-us" as const;
export const MARKETPLACE_CURRENCY = "USD" as const;
export type MarketplaceCurrency = typeof MARKETPLACE_CURRENCY;
export type OperatingCurrency = "USD" | "SGD";
export type MoneyCurrency = OperatingCurrency;

export type SourceLabel = "verified" | "synthetic";

export const COST_CENTRE_KINDS = [
  "ai_api",
  "infra",
  "storage",
  "saas",
  "marketplace",
  "other",
] as const;
export type CostCentreKind = (typeof COST_CENTRE_KINDS)[number];

/** Operating cost centre with mandatory provenance. */
export type CostCentre = {
  id: string;
  kind: CostCentreKind;
  label: string;
  amount: number;
  currency: MoneyCurrency;
  sourceLabel: SourceLabel;
  period?: string;
  notes?: string;
};

/** Forbidden live-commerce fields — must never appear on synthetic ledger APIs. */
export type ForbiddenLiveLedgerFields = {
  liveSales?: unknown;
  realisedLiveProfit?: unknown;
};

export type TrueProfitLedgerLineInputs = {
  revenue: number;
  productCost: number;
  shipping: number;
  fees: number;
  ads: number;
  refunds: number;
  returns: number;
  opex: number;
};

/**
 * Single true-profit ledger row. `synthetic: true` is mandatory.
 * Must not carry liveSales / realisedLiveProfit.
 */
export type TrueProfitLedgerEntry = TrueProfitLedgerLineInputs & {
  entryId: string;
  synthetic: true;
  currency: MoneyCurrency;
  productId?: string;
  orderId?: string;
  costCentreIds?: string[];
  notes?: string;
};

export type TrueProfitLedgerTotals = TrueProfitLedgerLineInputs & {
  realisedNetProfit: number;
};

export type TrueProfitLedger = {
  ledgerId: string;
  marketplace: typeof SYNTHETIC_MARKETPLACE;
  synthetic: true;
  currency: MoneyCurrency;
  entries: TrueProfitLedgerEntry[];
  totals: TrueProfitLedgerTotals;
};

export const ELIGIBILITY_HARD_STOPS = [
  "policy",
  "ip",
  "approval",
  "stock",
  "quality",
  "delivery",
  "economic",
] as const;
export type EligibilityHardStop = (typeof ELIGIBILITY_HARD_STOPS)[number];

export type EligibilityRiskFilter = {
  productId: string;
  marketplace: typeof SYNTHETIC_MARKETPLACE;
  synthetic: true;
  hardStops: Record<EligibilityHardStop, boolean>;
  eligible: boolean;
  reasons: string[];
};

export type UnitEconomics = {
  productId: string;
  variantId?: string;
  landedCost: number;
  contributionBeforeAds: number;
  contributionAfterAds: number;
  expectedRefundEffect: number;
  realisedContribution: number;
  currency: MoneyCurrency;
  source: "synthetic";
};

export type SyntheticExperimentStatus =
  | "planned"
  | "running"
  | "completed"
  | "aborted";

export type SyntheticExperimentRecord = {
  experimentId: string;
  hypothesis: string;
  corridor: string;
  marketplace: typeof SYNTHETIC_MARKETPLACE;
  synthetic: true;
  status: SyntheticExperimentStatus;
  startedAt: string;
  completedAt?: string;
  productIds: string[];
  predictedContributionUsd: number;
  observedContributionUsd?: number;
  notes?: string;
};

export const PORTFOLIO_CANDIDATE_STATES = [
  "kill",
  "watch",
  "test",
  "scale",
  "hold",
] as const;
export type PortfolioCandidateState = (typeof PORTFOLIO_CANDIDATE_STATES)[number];

export type PortfolioCandidate = {
  productId: string;
  state: PortfolioCandidateState;
  eligible: boolean;
  realisedContributionUsd: number;
};

/**
 * Synthetic portfolio snapshot (distinct from revenue opportunity-portfolio states).
 * Shadow-CEO may import this type later; do not confuse with DISCOVERED/WATCHLIST/etc.
 */
export type PortfolioState = {
  portfolioId: string;
  marketplace: typeof SYNTHETIC_MARKETPLACE;
  synthetic: true;
  currency: MarketplaceCurrency;
  candidates: PortfolioCandidate[];
  totals: {
    candidateCount: number;
    killCount: number;
    watchCount: number;
    testCount: number;
    scaleCount: number;
    holdCount: number;
  };
};

export type SyntheticSupplierApiCapability = {
  capabilityId: string;
  name: string;
  supportsStockQuery: boolean;
  supportsPriceQuery: boolean;
  supportsOrderCreate: boolean;
  supportsTracking: boolean;
  synthetic: true;
};

export type SyntheticSupplier = {
  supplierId: string;
  name: string;
  originCountry: string;
  apiCapabilities: SyntheticSupplierApiCapability[];
  synthetic: true;
};

export type SyntheticWarehouse = {
  warehouseId: string;
  supplierId: string;
  region: string;
  country: string;
  processingDays: number;
  synthetic: true;
};

export type SyntheticVariant = {
  variantId: string;
  sku: string;
  attributes: Record<string, string>;
  unitProductCostUsd: number;
  stockUnits: number;
};

export type SyntheticProduct = {
  productId: string;
  title: string;
  asin: string;
  supplierId: string;
  warehouseId: string;
  category: string;
  variants: SyntheticVariant[];
  listPriceUsd: number;
  amazonReferralFeeUsd: number;
  fbaOrSellerFeeUsd: number;
  shippingEstimateUsd: number;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  expectedRefundRate: number;
  adsSpendPerUnitUsd: number;
  amazonEligibility: {
    policyClear: boolean;
    ipClear: boolean;
    approvalRequired: boolean;
    restrictedCategory: boolean;
  };
  synthetic: true;
};

export type SyntheticStockSnapshot = {
  productId: string;
  variantId: string;
  warehouseId: string;
  onHand: number;
  reserved: number;
  available: number;
  synthetic: true;
};

export type SyntheticOrderStatus =
  | "placed"
  | "cancelled"
  | "fulfilled"
  | "delivered"
  | "returned"
  | "refunded";

export type SyntheticOrder = {
  orderId: string;
  productId: string;
  variantId: string;
  quantity: number;
  revenueUsd: number;
  status: SyntheticOrderStatus;
  fulfilmentOutcome: "ok" | "late" | "damaged" | "cancelled" | "returned";
  cancelled: boolean;
  refundUsd: number;
  returnCostUsd: number;
  synthetic: true;
};

export type SyntheticAmazonUsCatalog = {
  version: "v1";
  marketplace: typeof SYNTHETIC_MARKETPLACE;
  currency: MarketplaceCurrency;
  synthetic: true;
  suppliers: SyntheticSupplier[];
  warehouses: SyntheticWarehouse[];
  products: SyntheticProduct[];
  stock: SyntheticStockSnapshot[];
  orders: SyntheticOrder[];
  costCentres: CostCentre[];
  unitEconomics: UnitEconomics[];
  eligibility: EligibilityRiskFilter[];
  ledgerEntries: TrueProfitLedgerEntry[];
  experiments: SyntheticExperimentRecord[];
  portfolio: PortfolioState;
};
