import type {
  ProductIntelligenceConnector,
  ProductIntelligenceConnectorContext,
  ProductIntelligenceProviderId,
  ProductIntelligenceSignal,
  ProductSignalQuery,
  TrendDirection,
} from "./types.js";

const PROVIDER_NAMES: Record<ProductIntelligenceProviderId, string> = {
  "cj-dropshipping": "CJ Dropshipping",
  amazon: "Amazon",
  "tiktok-shop": "TikTok Shop",
  ebay: "eBay",
  walmart: "Walmart",
  aliexpress: "AliExpress",
  "google-trends": "Google Trends",
  "meta-ad-library": "Meta Ad Library",
};

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function seededValue(seed: number, min: number, max: number): number {
  const normalized = (seed % 10_000) / 10_000;
  return Math.round(min + normalized * (max - min));
}

function trendFromSeed(seed: number): TrendDirection {
  const mod = seed % 3;
  if (mod === 0) return "rising";
  if (mod === 1) return "stable";
  return "falling";
}

export function buildMockProductSignal(
  providerId: ProductIntelligenceProviderId,
  context: ProductIntelligenceConnectorContext,
  query: ProductSignalQuery,
): ProductIntelligenceSignal {
  const seed = hashSeed(`${providerId}:${query.productTitle}:${query.category}`);
  const demandIndex = seededValue(seed, 25, 98);
  const competitionIndex = seededValue(seed + 17, 20, 95);
  const marginEstimatePct = seededValue(seed + 31, 12, 72);
  const purchasePriceCents = seededValue(seed + 7, 150, 2500);
  const estimatedSellingPriceCents = Math.round(
    purchasePriceCents * (1 + marginEstimatePct / 100),
  );
  const shippingCostCents = seededValue(seed + 43, 80, 900);
  const supplierAvailable = providerId === "google-trends" || providerId === "meta-ad-library"
    ? true
    : demandIndex > 30;

  const providerBias: Partial<Record<ProductIntelligenceProviderId, number>> = {
    "cj-dropshipping": 8,
    aliexpress: -4,
    amazon: -6,
    walmart: -2,
    "tiktok-shop": 12,
    "google-trends": 5,
    "meta-ad-library": 3,
    ebay: 0,
  };

  const adjustedDemand = Math.max(
    0,
    Math.min(100, demandIndex + (providerBias[providerId] ?? 0)),
  );

  return {
    providerId,
    providerName: PROVIDER_NAMES[providerId],
    productTitle: query.productTitle,
    category: query.category,
    demandIndex: adjustedDemand,
    competitionIndex,
    marginEstimatePct,
    supplierAvailable,
    trendDirection: trendFromSeed(seed + 5),
    confidence: seededValue(seed + 59, 55, 95),
    purchasePriceCents,
    estimatedSellingPriceCents,
    shippingCostCents,
    searchVolumeIndex: adjustedDemand,
    monthlyOrdersEstimate: seededValue(seed + 71, 100, 8000),
    mock: true,
    fetchedAt: new Date().toISOString(),
  };
}

export function createMockProductIntelligenceConnector(
  providerId: ProductIntelligenceProviderId,
): ProductIntelligenceConnector {
  return {
    providerId,
    providerName: PROVIDER_NAMES[providerId],
    async fetchProductSignals(
      context: ProductIntelligenceConnectorContext,
      query: ProductSignalQuery,
    ): Promise<ProductIntelligenceSignal> {
      return buildMockProductSignal(providerId, context, query);
    },
  };
}

export const PRODUCT_INTELLIGENCE_PROVIDER_IDS: readonly ProductIntelligenceProviderId[] = [
  "cj-dropshipping",
  "amazon",
  "tiktok-shop",
  "ebay",
  "walmart",
  "aliexpress",
  "google-trends",
  "meta-ad-library",
] as const;
