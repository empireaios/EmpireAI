import type { ProductTrendDirection, ProductSignal } from "../../../contract/product-signal.js";
import type { ProductSignalEnvelope } from "../../../contract/signal-envelope.js";
import type { EyeRawObservation } from "../../../types.js";
import { buildSubjectKey } from "../../../pipelines/signal-normalization-pipeline.js";
import type { SearchInterest } from "../models/search-interest.js";
import type {
  BreakoutTrend,
  GeoPopularity,
  SeasonalityProfile,
  TrendMomentum,
} from "../models/trend-momentum.js";

export const GOOGLE_TRENDS_PROVIDER_ID = "google-trends";
export const GOOGLE_TRENDS_PROVIDER_NAME = "Google Trends";

/** Internal Google Trends observation payload before Eye normalization. */
export type GoogleTrendsObservationPayload = {
  providerName: string;
  keyword: string;
  productTitle: string;
  category: string;
  region: string;
  demandIndex: number;
  competitionIndex: number;
  marginEstimatePct: number;
  trendDirection: ProductTrendDirection;
  interestScore: number;
  momentumScore: number;
  changePct: number;
  seasonality: {
    isSeasonal: boolean;
    peakMonths: string[];
    seasonalityIndex: number;
  };
  geoPopularity: {
    topRegion: string;
    regions: Array<{ region: string; interestScore: number }>;
  };
  breakout: {
    isBreakout: boolean;
    breakoutScore: number;
    relatedQueries: string[];
  };
  timeline: Array<{ date: string; value: number }>;
};

function interestToDemandIndex(interest: SearchInterest): number {
  return Math.round(Math.min(100, Math.max(10, interest.interestScore)));
}

function breakoutToCompetitionIndex(breakout: BreakoutTrend, geo: GeoPopularity): number {
  const breakoutFactor = breakout.isBreakout ? breakout.breakoutScore * 0.4 : breakout.breakoutScore * 0.2;
  const geoSpread =
    geo.regions.length > 1
      ? geo.regions[0]!.interestScore - geo.regions[geo.regions.length - 1]!.interestScore
      : 0;
  const geoFactor = Math.min(30, geoSpread * 0.3);
  return Math.round(Math.min(100, breakoutFactor + geoFactor + 20));
}

function estimateMarginFromMomentum(momentum: TrendMomentum): number {
  const base = 25;
  const momentumBonus = Math.min(25, Math.round(momentum.momentumScore * 0.25));
  return base + momentumBonus;
}

/** Maps typed Google Trends models to internal observation payload. */
export function mapTrendsToObservationPayload(
  interest: SearchInterest,
  momentum: TrendMomentum,
  seasonality: SeasonalityProfile,
  geo: GeoPopularity,
  breakout: BreakoutTrend,
  category: string,
  normalizedKeyword?: string,
): GoogleTrendsObservationPayload {
  const keyword = normalizedKeyword ?? interest.keyword;
  return {
    providerName: GOOGLE_TRENDS_PROVIDER_NAME,
    keyword,
    productTitle: keyword,
    category,
    region: interest.region,
    demandIndex: interestToDemandIndex(interest),
    competitionIndex: breakoutToCompetitionIndex(breakout, geo),
    marginEstimatePct: estimateMarginFromMomentum(momentum),
    trendDirection: momentum.direction,
    interestScore: interest.interestScore,
    momentumScore: momentum.momentumScore,
    changePct: momentum.changePct,
    seasonality: {
      isSeasonal: seasonality.isSeasonal,
      peakMonths: seasonality.peakMonths,
      seasonalityIndex: seasonality.seasonalityIndex,
    },
    geoPopularity: {
      topRegion: geo.topRegion,
      regions: geo.regions,
    },
    breakout: {
      isBreakout: breakout.isBreakout,
      breakoutScore: breakout.breakoutScore,
      relatedQueries: breakout.relatedQueries,
    },
    timeline: interest.timeline,
  };
}

/** Converts Google Trends observation payload to EyeRawObservation for pipeline ingestion. */
export function mapObservationPayloadToRaw(
  payload: GoogleTrendsObservationPayload,
  fetchedAt: string,
  observationId: string,
): EyeRawObservation {
  return {
    observationId,
    providerId: GOOGLE_TRENDS_PROVIDER_ID,
    domain: "product",
    payload: payload as unknown as Record<string, unknown>,
    fetchedAt,
    mock: true,
    sourceRef: `mock://${GOOGLE_TRENDS_PROVIDER_ID}/observe/${payload.keyword}`,
  };
}

/** Maps a normalized observation directly to ProductSignal (used by tests and direct consumers). */
export function mapObservationPayloadToProductSignal(
  payload: GoogleTrendsObservationPayload,
  workspaceId: string,
  observationId: string,
  fetchedAt: string,
): ProductSignal {
  const normalizedAt = new Date().toISOString();
  const subjectKey = buildSubjectKey("product", GOOGLE_TRENDS_PROVIDER_ID, {
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
    providerId: GOOGLE_TRENDS_PROVIDER_ID,
    providerName: payload.providerName,
    workspaceId,
    productTitle: payload.productTitle,
    category: payload.category,
    demandIndex: payload.demandIndex,
    competitionIndex: payload.competitionIndex,
    marginEstimatePct: payload.marginEstimatePct,
    trendDirection: payload.trendDirection,
    confidence: Math.min(confidence, 60),
    mock: true,
    fetchedAt,
    normalizedAt,
    observationIds: [observationId],
    subjectKey,
  };
}

export function mapObservationPayloadToEnvelope(
  payload: GoogleTrendsObservationPayload,
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
    providerId: GOOGLE_TRENDS_PROVIDER_ID,
    providerName: payload.providerName,
    subjectKey: productSignal.subjectKey,
    payload: productSignal,
    confidence: productSignal.confidence,
    confidenceFactors: [
      {
        name: "payloadCompleteness",
        weight: 1,
        value: productSignal.confidence,
        explanation: "Google Trends observation field completeness (mock capped at 60)",
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
      sourceRefs: [`mock://${GOOGLE_TRENDS_PROVIDER_ID}/observe/${payload.keyword}`],
    },
    normalizedAt: productSignal.normalizedAt,
  };
}
