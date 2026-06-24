import type { SearchInterest } from "../models/search-interest.js";
import type {
  BreakoutTrend,
  GeoPopularity,
  SeasonalityProfile,
  TrendMomentum,
} from "../models/trend-momentum.js";
import type { TrendsQuery } from "../models/trends-query.js";
import {
  MOCK_BREAKOUT_TRENDS,
  MOCK_GEO_POPULARITY,
  MOCK_SEARCH_INTEREST,
  MOCK_SEASONALITY,
  MOCK_TREND_MOMENTUM,
  SAMPLE_KEYWORDS,
} from "./fixtures.js";
import {
  MockTrendsParser,
  type TrendsDataSource,
  type TrendsParser,
} from "../parsers/trends-parser.js";

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function resolveKeyword(query: TrendsQuery): string {
  if (query.keyword && MOCK_SEARCH_INTEREST[query.keyword]) {
    return query.keyword;
  }

  const title = (query.productTitle ?? query.keyword ?? "").toLowerCase();
  if (title.includes("blender") || title.includes("usb")) {
    return SAMPLE_KEYWORDS.USB_BLENDER;
  }
  if (title.includes("earbud") || title.includes("headphone")) {
    return SAMPLE_KEYWORDS.WIRELESS_EARBUDS;
  }
  if (title.includes("yoga") || title.includes("mat")) {
    return SAMPLE_KEYWORDS.YOGA_MAT;
  }

  const seed = hashSeed(`${query.productTitle ?? ""}:${query.category ?? ""}`);
  const keywords = Object.keys(MOCK_SEARCH_INTEREST);
  return keywords[seed % keywords.length] ?? SAMPLE_KEYWORDS.USB_BLENDER;
}

function synthesizeInterest(query: TrendsQuery, keyword: string): SearchInterest {
  const base = MOCK_SEARCH_INTEREST[keyword];
  if (!base) {
    throw new Error(`Unknown mock keyword: ${keyword}`);
  }

  return {
    ...base,
    keyword,
    region: query.region ?? base.region,
    observedAt: new Date().toISOString(),
  };
}

/** In-memory mock data source — no network, no credentials. */
export class MockTrendsDataSource implements TrendsDataSource {
  private readonly parser: TrendsParser;

  constructor(parser: TrendsParser = new MockTrendsParser()) {
    this.parser = parser;
  }

  async fetchSearchInterest(query: TrendsQuery): Promise<SearchInterest> {
    const keyword = resolveKeyword(query);
    const raw = synthesizeInterest(query, keyword);
    return this.parser.parseSearchInterest(raw);
  }

  async fetchMomentum(keyword: string): Promise<TrendMomentum> {
    const resolved = resolveKeyword({ keyword });
    const raw = MOCK_TREND_MOMENTUM[resolved];
    if (!raw) {
      throw new Error(`No mock momentum for keyword: ${keyword}`);
    }
    return this.parser.parseMomentum({ ...raw, observedAt: new Date().toISOString() });
  }

  async fetchSeasonality(keyword: string): Promise<SeasonalityProfile> {
    const resolved = resolveKeyword({ keyword });
    const raw = MOCK_SEASONALITY[resolved];
    if (!raw) {
      throw new Error(`No mock seasonality for keyword: ${keyword}`);
    }
    return this.parser.parseSeasonality({ ...raw, observedAt: new Date().toISOString() });
  }

  async fetchGeoPopularity(keyword: string): Promise<GeoPopularity> {
    const resolved = resolveKeyword({ keyword });
    const raw = MOCK_GEO_POPULARITY[resolved];
    if (!raw) {
      throw new Error(`No mock geo popularity for keyword: ${keyword}`);
    }
    return this.parser.parseGeoPopularity({ ...raw, observedAt: new Date().toISOString() });
  }

  async fetchBreakout(keyword: string): Promise<BreakoutTrend> {
    const resolved = resolveKeyword({ keyword });
    const raw = MOCK_BREAKOUT_TRENDS[resolved];
    if (!raw) {
      throw new Error(`No mock breakout for keyword: ${keyword}`);
    }
    return this.parser.parseBreakout({ ...raw, observedAt: new Date().toISOString() });
  }
}

export function createMockTrendsDataSource(parser?: TrendsParser): MockTrendsDataSource {
  return new MockTrendsDataSource(parser);
}
