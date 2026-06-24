import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AmazonConnector,
  createAmazonConnector,
  AMAZON_PROVIDER_ID,
  mapAmazonToObservationPayload,
  mapObservationPayloadToProductSignal,
  SAMPLE_ASINS,
  MOCK_AMAZON_PRODUCTS,
  MOCK_PRODUCT_RANKINGS,
  MOCK_REVIEW_STATISTICS,
  MOCK_PRICE_HISTORIES,
  MockAmazonProductParser,
  MockBestsellerParser,
  MockBestsellerCategoryProvider,
  createMockAmazonDataSource,
} from "../../eye/index.js";
import { SignalNormalizationPipeline } from "../../eye/index.js";

describe("Mission 019 Amazon — unit tests", () => {
  describe("Amazon models and fixtures", () => {
    it("fixtures contain required ASINs with product, ranking, and review data", () => {
      const asin = SAMPLE_ASINS.USB_BLENDER;
      assert.ok(MOCK_AMAZON_PRODUCTS[asin]);
      assert.ok(MOCK_PRODUCT_RANKINGS[asin]);
      assert.ok(MOCK_REVIEW_STATISTICS[asin]);
      assert.ok(MOCK_PRICE_HISTORIES[asin]);
      assert.equal(MOCK_AMAZON_PRODUCTS[asin]?.brand, "BlendGo");
    });
  });

  describe("MockAmazonProductParser", () => {
    it("parses valid product payloads and rejects invalid input", () => {
      const parser = new MockAmazonProductParser();
      const product = parser.parseProduct(MOCK_AMAZON_PRODUCTS[SAMPLE_ASINS.USB_BLENDER]);
      assert.equal(product.asin, SAMPLE_ASINS.USB_BLENDER);

      assert.throws(() => parser.parseProduct(null), /Invalid Amazon product/);
      assert.throws(() => parser.parseProduct({ title: "no asin" }), /missing required fields/);
    });

    it("parses ranking and review statistics", () => {
      const parser = new MockAmazonProductParser();
      const ranking = parser.parseRanking(MOCK_PRODUCT_RANKINGS[SAMPLE_ASINS.WIRELESS_EARBUDS]);
      assert.equal(ranking.categoryRank, 3);

      const reviews = parser.parseReviewStatistics(MOCK_REVIEW_STATISTICS[SAMPLE_ASINS.YOGA_MAT]);
      assert.equal(reviews.reviewCount, 890);
    });
  });

  describe("MockBestsellerParser", () => {
    it("parses category tree and bestseller listings", async () => {
      const provider = new MockBestsellerCategoryProvider(new MockBestsellerParser());
      const tree = await provider.getCategoryTree("US");
      assert.ok(tree.length >= 3);
      assert.equal(tree[0]?.name, "Kitchen & Dining");

      const listing = await provider.getBestsellersInCategory("kitchen-blenders", 2);
      assert.equal(listing.asins.length, 2);
      assert.ok(listing.asins.includes(SAMPLE_ASINS.USB_BLENDER));
    });
  });

  describe("MockAmazonDataSource", () => {
    it("resolves ASIN from product title keywords", async () => {
      const source = createMockAmazonDataSource();
      const product = await source.fetchProduct({
        productTitle: "Portable USB Blender",
        category: "Kitchen",
      });
      assert.equal(product.asin, SAMPLE_ASINS.USB_BLENDER);
    });

    it("returns price history for known ASINs", async () => {
      const source = createMockAmazonDataSource();
      const history = await source.getPriceHistory(SAMPLE_ASINS.USB_BLENDER);
      assert.ok(history.snapshots.length >= 2);
      assert.equal(history.priceTrend, "falling");
    });
  });

  describe("product-signal-mapper", () => {
    it("maps Amazon models to observation payload with derived indices", () => {
      const asin = SAMPLE_ASINS.WIRELESS_EARBUDS;
      const payload = mapAmazonToObservationPayload(
        MOCK_AMAZON_PRODUCTS[asin]!,
        MOCK_PRODUCT_RANKINGS[asin]!,
        MOCK_REVIEW_STATISTICS[asin]!,
        MOCK_PRICE_HISTORIES[asin]!,
      );

      assert.equal(payload.asin, asin);
      assert.equal(payload.productTitle, "Wireless Earbuds with Active Noise Cancellation");
      assert.ok(payload.demandIndex >= 10 && payload.demandIndex <= 100);
      assert.ok(payload.competitionIndex >= 0 && payload.competitionIndex <= 100);
      assert.equal(payload.trendDirection, "stable");
      assert.equal(payload.avgRating, 4.5);
    });

    it("maps observation payload to ProductSignal", () => {
      const asin = SAMPLE_ASINS.USB_BLENDER;
      const payload = mapAmazonToObservationPayload(
        MOCK_AMAZON_PRODUCTS[asin]!,
        MOCK_PRODUCT_RANKINGS[asin]!,
        MOCK_REVIEW_STATISTICS[asin]!,
        MOCK_PRICE_HISTORIES[asin]!,
      );

      const signal = mapObservationPayloadToProductSignal(
        payload,
        "ws-amazon-unit",
        "obs-amazon-1",
        new Date().toISOString(),
      );

      assert.equal(signal.providerId, AMAZON_PROVIDER_ID);
      assert.equal(signal.workspaceId, "ws-amazon-unit");
      assert.equal(signal.mock, true);
      assert.ok(signal.confidence <= 60);
      assert.ok(signal.subjectKey.length >= 8);
    });
  });

  describe("AmazonConnector", () => {
    it("returns mock observations for product domain poll", async () => {
      const connector = new AmazonConnector();
      const ctx = { workspaceId: "ws-amazon", correlationId: "corr-1" };

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
      assert.equal(observations[0]?.providerId, AMAZON_PROVIDER_ID);
      assert.equal(observations[0]?.mock, true);
      assert.equal(observations[0]?.payload.asin, SAMPLE_ASINS.USB_BLENDER);
      assert.ok(typeof observations[0]?.payload.demandIndex === "number");
    });

    it("returns empty array for unsupported domains", async () => {
      const connector = createAmazonConnector({ supportedDomains: ["product"] });
      const obs = await connector.observe(
        { workspaceId: "ws", correlationId: "c" },
        { domain: "risk", query: {} },
      );
      assert.deepEqual(obs, []);
    });

    it("normalizes Amazon observations via SignalNormalizationPipeline", async () => {
      const connector = new AmazonConnector();
      const pipeline = new SignalNormalizationPipeline();
      const observations = await connector.observe(
        { workspaceId: "ws-norm-amazon", correlationId: "c-norm" },
        {
          domain: "product",
          query: { productTitle: "Wireless Earbuds", category: "Electronics" },
        },
      );

      const envelope = pipeline.normalizeProductObservation(
        "ws-norm-amazon",
        observations[0]!,
      );

      assert.equal(envelope.domain, "product");
      assert.equal(envelope.payload.providerId, AMAZON_PROVIDER_ID);
      assert.equal(envelope.payload.category, "Electronics");
      assert.ok(envelope.payload.demandIndex > 0);
      assert.equal(envelope.payload.mock, true);
    });
  });
});
