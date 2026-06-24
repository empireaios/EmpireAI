import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GoogleTrendsConnector,
  createGoogleTrendsConnector,
  GOOGLE_TRENDS_PROVIDER_ID,
  mapTrendsToObservationPayload,
  mapGoogleTrendsObservationPayloadToProductSignal,
  SAMPLE_KEYWORDS,
  MOCK_SEARCH_INTEREST,
  MOCK_TREND_MOMENTUM,
  MOCK_SEASONALITY,
  MOCK_GEO_POPULARITY,
  MOCK_BREAKOUT_TRENDS,
  MockTrendsParser,
  MockTrendingTopicsProvider,
  createMockTrendsDataSource,
} from "../../eye/index.js";
import { SignalNormalizationPipeline } from "../../eye/index.js";

describe("Mission 021 Google Trends — unit tests", () => {
  describe("Google Trends models and fixtures", () => {
    it("fixtures contain required keywords with interest, momentum, and seasonality data", () => {
      const keyword = SAMPLE_KEYWORDS.USB_BLENDER;
      assert.ok(MOCK_SEARCH_INTEREST[keyword]);
      assert.ok(MOCK_TREND_MOMENTUM[keyword]);
      assert.ok(MOCK_SEASONALITY[keyword]);
      assert.ok(MOCK_GEO_POPULARITY[keyword]);
      assert.ok(MOCK_BREAKOUT_TRENDS[keyword]);
      assert.equal(MOCK_SEARCH_INTEREST[keyword]?.interestScore, 78);
    });
  });

  describe("MockTrendsParser", () => {
    it("parses valid search interest payloads and rejects invalid input", () => {
      const parser = new MockTrendsParser();
      const interest = parser.parseSearchInterest(MOCK_SEARCH_INTEREST[SAMPLE_KEYWORDS.USB_BLENDER]);
      assert.equal(interest.keyword, SAMPLE_KEYWORDS.USB_BLENDER);

      assert.throws(() => parser.parseSearchInterest(null), /Invalid search interest/);
      assert.throws(() => parser.parseSearchInterest({ keyword: "test" }), /missing keyword or interestScore/);
    });

    it("parses momentum, seasonality, geo, and breakout payloads", () => {
      const parser = new MockTrendsParser();
      const momentum = parser.parseMomentum(MOCK_TREND_MOMENTUM[SAMPLE_KEYWORDS.WIRELESS_EARBUDS]);
      assert.equal(momentum.direction, "stable");

      const seasonality = parser.parseSeasonality(MOCK_SEASONALITY[SAMPLE_KEYWORDS.YOGA_MAT]);
      assert.equal(seasonality.isSeasonal, true);

      const geo = parser.parseGeoPopularity(MOCK_GEO_POPULARITY[SAMPLE_KEYWORDS.USB_BLENDER]);
      assert.equal(geo.topRegion, "US-CA");

      const breakout = parser.parseBreakout(MOCK_BREAKOUT_TRENDS[SAMPLE_KEYWORDS.USB_BLENDER]);
      assert.equal(breakout.isBreakout, true);
    });
  });

  describe("MockTrendingTopicsProvider", () => {
    it("returns trending keywords for category seeds", async () => {
      const provider = new MockTrendingTopicsProvider();
      const listing = await provider.getTrendingKeywords("kitchen-blenders", 2);
      assert.equal(listing.keywords.length, 2);
      assert.ok(listing.keywords.includes(SAMPLE_KEYWORDS.USB_BLENDER));
    });
  });

  describe("MockTrendsDataSource", () => {
    it("resolves keyword from product title keywords", async () => {
      const source = createMockTrendsDataSource();
      const interest = await source.fetchSearchInterest({
        productTitle: "Portable USB Blender",
        category: "Kitchen",
      });
      assert.equal(interest.keyword, SAMPLE_KEYWORDS.USB_BLENDER);
    });

    it("returns momentum and breakout data for known keywords", async () => {
      const source = createMockTrendsDataSource();
      const momentum = await source.fetchMomentum(SAMPLE_KEYWORDS.USB_BLENDER);
      assert.equal(momentum.direction, "rising");

      const breakout = await source.fetchBreakout(SAMPLE_KEYWORDS.USB_BLENDER);
      assert.ok(breakout.breakoutScore > 0);
    });
  });

  describe("product-signal-mapper", () => {
    it("maps Google Trends models to observation payload with derived indices", () => {
      const keyword = SAMPLE_KEYWORDS.WIRELESS_EARBUDS;
      const payload = mapTrendsToObservationPayload(
        MOCK_SEARCH_INTEREST[keyword]!,
        MOCK_TREND_MOMENTUM[keyword]!,
        MOCK_SEASONALITY[keyword]!,
        MOCK_GEO_POPULARITY[keyword]!,
        MOCK_BREAKOUT_TRENDS[keyword]!,
        "Electronics",
      );

      assert.equal(payload.keyword, keyword);
      assert.equal(payload.productTitle, keyword);
      assert.ok(payload.demandIndex >= 10 && payload.demandIndex <= 100);
      assert.ok(payload.competitionIndex >= 0 && payload.competitionIndex <= 100);
      assert.equal(payload.trendDirection, "stable");
      assert.equal(payload.seasonality.isSeasonal, false);
      assert.ok(payload.breakout.relatedQueries.length >= 1);
    });

    it("maps observation payload to ProductSignal", () => {
      const keyword = SAMPLE_KEYWORDS.USB_BLENDER;
      const payload = mapTrendsToObservationPayload(
        MOCK_SEARCH_INTEREST[keyword]!,
        MOCK_TREND_MOMENTUM[keyword]!,
        MOCK_SEASONALITY[keyword]!,
        MOCK_GEO_POPULARITY[keyword]!,
        MOCK_BREAKOUT_TRENDS[keyword]!,
        "Kitchen & Dining",
      );

      const signal = mapGoogleTrendsObservationPayloadToProductSignal(
        payload,
        "ws-trends-unit",
        "obs-trends-1",
        new Date().toISOString(),
      );

      assert.equal(signal.providerId, GOOGLE_TRENDS_PROVIDER_ID);
      assert.equal(signal.workspaceId, "ws-trends-unit");
      assert.equal(signal.mock, true);
      assert.ok(signal.confidence <= 60);
      assert.ok(signal.subjectKey.length >= 8);
    });
  });

  describe("GoogleTrendsConnector", () => {
    it("returns mock observations for product domain poll", async () => {
      const connector = new GoogleTrendsConnector();
      const ctx = { workspaceId: "ws-trends", correlationId: "corr-1" };

      await connector.connect(ctx, "mock://no-credentials");
      const health = await connector.healthCheck(ctx);
      assert.equal(health.healthState, "healthy");

      const observations = await connector.observe(ctx, {
        domain: "product",
        query: {
          productTitle: "Portable USB Blender",
          category: "Kitchen & Dining",
        },
      });

      assert.equal(observations.length, 1);
      assert.equal(observations[0]?.providerId, GOOGLE_TRENDS_PROVIDER_ID);
      assert.equal(observations[0]?.mock, true);
      assert.equal(observations[0]?.payload.keyword, SAMPLE_KEYWORDS.USB_BLENDER);
      assert.ok(typeof observations[0]?.payload.demandIndex === "number");
      assert.ok(observations[0]?.payload.seasonality);
      assert.ok(observations[0]?.payload.geoPopularity);
      assert.ok(observations[0]?.payload.breakout);
    });

    it("returns empty array for unsupported domains", async () => {
      const connector = createGoogleTrendsConnector({ supportedDomains: ["product"] });
      const obs = await connector.observe(
        { workspaceId: "ws", correlationId: "c" },
        { domain: "risk", query: {} },
      );
      assert.deepEqual(obs, []);
    });

    it("normalizes Google Trends observations via SignalNormalizationPipeline", async () => {
      const connector = new GoogleTrendsConnector();
      const pipeline = new SignalNormalizationPipeline();
      const observations = await connector.observe(
        { workspaceId: "ws-norm-trends", correlationId: "c-norm" },
        {
          domain: "product",
          query: { productTitle: "Wireless Earbuds", category: "Electronics" },
        },
      );

      const envelope = pipeline.normalizeProductObservation(
        "ws-norm-trends",
        observations[0]!,
      );

      assert.equal(envelope.domain, "product");
      assert.equal(envelope.payload.providerId, GOOGLE_TRENDS_PROVIDER_ID);
      assert.equal(envelope.payload.category, "Electronics");
      assert.ok(envelope.payload.demandIndex > 0);
      assert.equal(envelope.payload.mock, true);
    });
  });
});
