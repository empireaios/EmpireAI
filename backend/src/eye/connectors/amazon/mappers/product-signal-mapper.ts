import type { ProductTrendDirection, ProductSignal } from "../../../contract/product-signal.js";
import type { ProductSignalEnvelope } from "../../../contract/signal-envelope.js";
import type { EyeRawObservation } from "../../../types.js";
import { buildSubjectKey } from "../../../pipelines/signal-normalization-pipeline.js";
import type { AmazonProduct } from "../models/amazon-product.js";
import type { ProductRanking } from "../models/product-ranking.js";
import type { ReviewStatistics } from "../models/review-statistics.js";
import type { PriceHistory } from "../interfaces/price-history.js";

export const AMAZON_PROVIDER_ID = "amazon-product-intelligence";
export const AMAZON_PROVIDER_NAME = "Amazon Product Intelligence";

/** Internal Amazon observation payload before Eye normalization. */
export type AmazonObservationPayload = {
  providerName: string;
  asin: string;
  productTitle: string;
  brand: string;
  category: string;
  subcategory?: string;
  priceCents: number;
  currency: string;
  demandIndex: number;
  competitionIndex: number;
  marginEstimatePct: number;
  estimatedSellingPriceCents: number;
  monthlyOrdersEstimate?: number;
  trendDirection: ProductTrendDirection;
  listingCount?: number;
  avgRating?: number;
  reviewCount?: number;
  bestsellerRank?: number | null;
  categoryRank?: number | null;
  popularityScore?: number;
  priceTrend?: ProductTrendDirection;
  imageCount?: number;
  marketplace: string;
};

function rankToDemandIndex(ranking: ProductRanking): number {
  if (ranking.bestsellerRank === null) {
    return ranking.estimatedPopularityScore;
  }
  const capped = Math.min(ranking.bestsellerRank, 10_000);
  return Math.round(Math.max(10, 100 - capped / 100));
}

function reviewsToCompetitionIndex(reviews: ReviewStatistics): number {
  const reviewFactor = Math.min(reviews.reviewCount / 100, 80);
  const ratingFactor = (reviews.averageRating / 5) * 20;
  return Math.round(Math.min(100, reviewFactor + ratingFactor));
}

function estimateMarginPct(priceHistory: PriceHistory): number {
  const spread = priceHistory.highestPriceCents - priceHistory.lowestPriceCents;
  const base = 25;
  const volatilityBonus = Math.min(20, Math.round(spread / priceHistory.averagePriceCents * 50));
  return base + volatilityBonus;
}

function estimateMonthlyOrders(ranking: ProductRanking, reviews: ReviewStatistics): number {
  const rankFactor = ranking.bestsellerRank
    ? Math.max(50, Math.round(50_000 / Math.sqrt(ranking.bestsellerRank)))
    : Math.round(reviews.reviewCount * 0.5);
  return Math.min(10_000, rankFactor);
}

function resolveTrend(
  ranking: ProductRanking,
  priceHistory: PriceHistory,
): ProductTrendDirection {
  if (ranking.rankTrend !== "stable") return ranking.rankTrend;
  return priceHistory.priceTrend;
}

/** Maps typed Amazon models to internal observation payload. */
export function mapAmazonToObservationPayload(
  product: AmazonProduct,
  ranking: ProductRanking,
  reviews: ReviewStatistics,
  priceHistory: PriceHistory,
): AmazonObservationPayload {
  return {
    providerName: AMAZON_PROVIDER_NAME,
    asin: product.asin,
    productTitle: product.title,
    brand: product.brand,
    category: product.category,
    subcategory: product.subcategory,
    priceCents: product.priceCents,
    currency: product.currency,
    demandIndex: rankToDemandIndex(ranking),
    competitionIndex: reviewsToCompetitionIndex(reviews),
    marginEstimatePct: estimateMarginPct(priceHistory),
    estimatedSellingPriceCents: product.priceCents,
    monthlyOrdersEstimate: estimateMonthlyOrders(ranking, reviews),
    trendDirection: resolveTrend(ranking, priceHistory),
    listingCount: reviews.reviewCount,
    avgRating: reviews.averageRating,
    reviewCount: reviews.reviewCount,
    bestsellerRank: ranking.bestsellerRank,
    categoryRank: ranking.categoryRank,
    popularityScore: ranking.estimatedPopularityScore,
    priceTrend: priceHistory.priceTrend,
    imageCount: product.images.length,
    marketplace: product.marketplace,
  };
}

/** Converts Amazon observation payload to EyeRawObservation for pipeline ingestion. */
export function mapObservationPayloadToRaw(
  payload: AmazonObservationPayload,
  fetchedAt: string,
  observationId: string,
): EyeRawObservation {
  return {
    observationId,
    providerId: AMAZON_PROVIDER_ID,
    domain: "product",
    payload: payload as unknown as Record<string, unknown>,
    fetchedAt,
    mock: true,
    sourceRef: `mock://${AMAZON_PROVIDER_ID}/observe/${payload.asin}`,
  };
}

/** Maps a normalized observation directly to ProductSignal (used by tests and direct consumers). */
export function mapObservationPayloadToProductSignal(
  payload: AmazonObservationPayload,
  workspaceId: string,
  observationId: string,
  fetchedAt: string,
): ProductSignal {
  const normalizedAt = new Date().toISOString();
  const subjectKey = buildSubjectKey("product", AMAZON_PROVIDER_ID, {
    productTitle: payload.productTitle,
    category: payload.category,
  });

  const fields = [
    payload.demandIndex,
    payload.competitionIndex,
    payload.marginEstimatePct,
    payload.productTitle,
    payload.category,
  ];
  const confidence = Math.round((fields.filter((f) => f !== undefined).length / 5) * 100);

  return {
    signalId: observationId,
    providerId: AMAZON_PROVIDER_ID,
    providerName: payload.providerName,
    workspaceId,
    productTitle: payload.productTitle,
    category: payload.category,
    demandIndex: payload.demandIndex,
    competitionIndex: payload.competitionIndex,
    marginEstimatePct: payload.marginEstimatePct,
    estimatedSellingPriceCents: payload.estimatedSellingPriceCents,
    monthlyOrdersEstimate: payload.monthlyOrdersEstimate,
    trendDirection: payload.trendDirection,
    listingCount: payload.listingCount,
    avgRating: payload.avgRating,
    confidence: Math.min(confidence, 60),
    mock: true,
    fetchedAt,
    normalizedAt,
    observationIds: [observationId],
    subjectKey,
  };
}

export function mapObservationPayloadToEnvelope(
  payload: AmazonObservationPayload,
  workspaceId: string,
  observationId: string,
  fetchedAt: string,
): ProductSignalEnvelope {
  const productSignal = mapObservationPayloadToProductSignal(
    payload,
    workspaceId,
    observationId,
    fetchedAt,
  );

  return {
    envelopeId: observationId,
    workspaceId,
    domain: "product",
    providerId: AMAZON_PROVIDER_ID,
    providerName: payload.providerName,
    subjectKey: productSignal.subjectKey,
    payload: productSignal,
    confidence: productSignal.confidence,
    confidenceFactors: [
      {
        name: "payloadCompleteness",
        weight: 1,
        value: productSignal.confidence,
        explanation: "Amazon observation field completeness (mock capped at 60)",
      },
      {
        name: "mockPenalty",
        weight: 1,
        value: 60,
        explanation: "Mock observations capped at 60 confidence",
      },
    ],
    provenance: {
      observationIds: [observationId],
      mock: true,
      fetchedAt,
      sourceRefs: [`mock://${AMAZON_PROVIDER_ID}/observe/${payload.asin}`],
    },
    normalizedAt: productSignal.normalizedAt,
  };
}
