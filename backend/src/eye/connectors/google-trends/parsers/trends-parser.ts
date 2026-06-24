import type { SearchInterest } from "../models/search-interest.js";
import type {
  BreakoutTrend,
  GeoPopularity,
  SeasonalityProfile,
  TrendMomentum,
} from "../models/trend-momentum.js";
import type { TrendsQuery } from "../models/trends-query.js";
import { MOCK_TRENDING_KEYWORDS } from "../mock/fixtures.js";

/** Parses raw Google Trends payloads — future live impl swaps here. */
export interface TrendsParser {
  parseSearchInterest(raw: unknown): SearchInterest;
  parseMomentum(raw: unknown): TrendMomentum;
  parseSeasonality(raw: unknown): SeasonalityProfile;
  parseGeoPopularity(raw: unknown): GeoPopularity;
  parseBreakout(raw: unknown): BreakoutTrend;
}

export interface TrendsDataSource {
  fetchSearchInterest(query: TrendsQuery): Promise<SearchInterest>;
  fetchMomentum(keyword: string): Promise<TrendMomentum>;
  fetchSeasonality(keyword: string): Promise<SeasonalityProfile>;
  fetchGeoPopularity(keyword: string): Promise<GeoPopularity>;
  fetchBreakout(keyword: string): Promise<BreakoutTrend>;
}

export type TrendingCategoryListing = {
  categoryId: string;
  categoryPath: string[];
  keywords: string[];
  observedAt: string;
};

export interface TrendingTopicsProvider {
  getTrendingKeywords(categoryId: string, limit?: number): Promise<TrendingCategoryListing>;
}

export class MockTrendsParser implements TrendsParser {
  parseSearchInterest(raw: unknown): SearchInterest {
    if (!raw || typeof raw !== "object") {
      throw new Error("Invalid search interest payload");
    }
    const data = raw as SearchInterest;
    if (!data.keyword || typeof data.interestScore !== "number") {
      throw new Error("Search interest missing keyword or interestScore");
    }
    return data;
  }

  parseMomentum(raw: unknown): TrendMomentum {
    if (!raw || typeof raw !== "object") {
      throw new Error("Invalid trend momentum payload");
    }
    const data = raw as TrendMomentum;
    if (!data.keyword || !data.direction) {
      throw new Error("Trend momentum missing keyword or direction");
    }
    return data;
  }

  parseSeasonality(raw: unknown): SeasonalityProfile {
    if (!raw || typeof raw !== "object") {
      throw new Error("Invalid seasonality payload");
    }
    return raw as SeasonalityProfile;
  }

  parseGeoPopularity(raw: unknown): GeoPopularity {
    if (!raw || typeof raw !== "object") {
      throw new Error("Invalid geo popularity payload");
    }
    return raw as GeoPopularity;
  }

  parseBreakout(raw: unknown): BreakoutTrend {
    if (!raw || typeof raw !== "object") {
      throw new Error("Invalid breakout trend payload");
    }
    return raw as BreakoutTrend;
  }
}

export class MockTrendingTopicsProvider implements TrendingTopicsProvider {
  async getTrendingKeywords(categoryId: string, limit = 10): Promise<TrendingCategoryListing> {
    const keywords = MOCK_TRENDING_KEYWORDS[categoryId] ?? MOCK_TRENDING_KEYWORDS.kitchen ?? [];
    return {
      categoryId,
      categoryPath: [categoryId],
      keywords: keywords.slice(0, limit),
      observedAt: new Date().toISOString(),
    };
  }
}
