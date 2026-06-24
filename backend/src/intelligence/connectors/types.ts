import type { HistoricalDemand } from "../product-intelligence-engine/types.js";

/** Product intelligence source providers — swappable mock/real implementations. */
export type ProductIntelligenceProviderId =
  | "cj-dropshipping"
  | "amazon"
  | "tiktok-shop"
  | "ebay"
  | "walmart"
  | "aliexpress"
  | "google-trends"
  | "meta-ad-library";

export type TrendDirection = HistoricalDemand["trendDirection"];

export type ProductSignalQuery = {
  productTitle: string;
  category: string;
  sku?: string;
};

export type ProductIntelligenceConnectorContext = {
  workspaceId: string;
  correlationId: string;
};

/** Normalized signal emitted by a single product intelligence connector. */
export type ProductIntelligenceSignal = {
  providerId: ProductIntelligenceProviderId;
  providerName: string;
  productTitle: string;
  category: string;
  demandIndex: number;
  /** Raw competition intensity 0–100 (higher = more crowded). */
  competitionIndex: number;
  marginEstimatePct: number;
  supplierAvailable: boolean;
  trendDirection: TrendDirection;
  confidence: number;
  purchasePriceCents?: number;
  estimatedSellingPriceCents?: number;
  shippingCostCents?: number;
  searchVolumeIndex?: number;
  monthlyOrdersEstimate?: number;
  mock: boolean;
  fetchedAt: string;
};

export interface ProductIntelligenceConnector {
  readonly providerId: ProductIntelligenceProviderId;
  readonly providerName: string;
  fetchProductSignals(
    context: ProductIntelligenceConnectorContext,
    query: ProductSignalQuery,
  ): Promise<ProductIntelligenceSignal>;
}

export type SupplierAvailability = "high" | "medium" | "low" | "unavailable";
