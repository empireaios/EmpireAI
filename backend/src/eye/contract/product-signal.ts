/** Unified product intelligence signal — normalized output of the product pipeline. */

export type ProductTrendDirection = "rising" | "stable" | "falling";

export type ProductSignalQuery = {
  productTitle: string;
  category: string;
  sku?: string;
  keywords?: string[];
  region?: string;
};

export type ProductSignal = {
  signalId: string;
  providerId: string;
  providerName: string;
  workspaceId: string;
  productTitle: string;
  category: string;
  demandIndex: number;
  competitionIndex: number;
  marginEstimatePct: number;
  estimatedSellingPriceCents?: number;
  monthlyOrdersEstimate?: number;
  trendDirection: ProductTrendDirection;
  listingCount?: number;
  avgRating?: number;
  confidence: number;
  mock: boolean;
  fetchedAt: string;
  normalizedAt: string;
  observationIds: string[];
  subjectKey: string;
};
