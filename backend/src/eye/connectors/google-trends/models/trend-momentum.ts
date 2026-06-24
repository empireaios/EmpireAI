import type { ProductTrendDirection } from "../../../contract/product-signal.js";

/** Momentum and ancillary trend signals from Google Trends. */
export type TrendMomentum = {
  keyword: string;
  direction: ProductTrendDirection;
  momentumScore: number;
  changePct: number;
  observedAt: string;
};

export type SeasonalityProfile = {
  keyword: string;
  isSeasonal: boolean;
  peakMonths: string[];
  seasonalityIndex: number;
  observedAt: string;
};

export type GeoPopularity = {
  keyword: string;
  regions: Array<{ region: string; interestScore: number }>;
  topRegion: string;
  observedAt: string;
};

export type BreakoutTrend = {
  keyword: string;
  isBreakout: boolean;
  breakoutScore: number;
  relatedQueries: string[];
  observedAt: string;
};
