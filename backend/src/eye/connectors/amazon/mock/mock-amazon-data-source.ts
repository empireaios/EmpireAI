import type { AmazonProduct, AmazonProductQuery } from "../models/amazon-product.js";
import type { ProductRanking } from "../models/product-ranking.js";
import type { ReviewStatistics } from "../models/review-statistics.js";
import type { PriceHistory, PriceHistoryProvider } from "../interfaces/price-history.js";
import {
  MOCK_AMAZON_PRODUCTS,
  MOCK_PRICE_HISTORIES,
  MOCK_PRODUCT_RANKINGS,
  MOCK_REVIEW_STATISTICS,
  SAMPLE_ASINS,
} from "../mock/fixtures.js";
import {
  MockAmazonProductParser,
  type AmazonProductDataSource,
  type AmazonProductParser,
} from "../parsers/amazon-product-parser.js";

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function resolveAsin(query: AmazonProductQuery): string {
  if (query.asin && MOCK_AMAZON_PRODUCTS[query.asin]) {
    return query.asin;
  }

  const title = (query.productTitle ?? "").toLowerCase();
  if (title.includes("blender") || title.includes("usb")) {
    return SAMPLE_ASINS.USB_BLENDER;
  }
  if (title.includes("earbud") || title.includes("headphone")) {
    return SAMPLE_ASINS.WIRELESS_EARBUDS;
  }
  if (title.includes("yoga") || title.includes("mat")) {
    return SAMPLE_ASINS.YOGA_MAT;
  }

  const seed = hashSeed(`${query.productTitle ?? ""}:${query.category ?? ""}`);
  const asins = Object.keys(MOCK_AMAZON_PRODUCTS);
  return asins[seed % asins.length] ?? SAMPLE_ASINS.USB_BLENDER;
}

function synthesizeProduct(query: AmazonProductQuery, asin: string): AmazonProduct {
  const base = MOCK_AMAZON_PRODUCTS[asin];
  if (!base) {
    throw new Error(`Unknown mock ASIN: ${asin}`);
  }

  return {
    ...base,
    title: query.productTitle ?? base.title,
    category: query.category ?? base.category,
    marketplace: query.marketplace ?? base.marketplace,
    observedAt: new Date().toISOString(),
  };
}

/** In-memory mock data source — no network, no credentials. */
export class MockAmazonDataSource implements AmazonProductDataSource, PriceHistoryProvider {
  private readonly parser: AmazonProductParser;

  constructor(parser: AmazonProductParser = new MockAmazonProductParser()) {
    this.parser = parser;
  }

  async fetchProduct(query: AmazonProductQuery): Promise<AmazonProduct> {
    const asin = resolveAsin(query);
    const raw = synthesizeProduct(query, asin);
    return this.parser.parseProduct(raw);
  }

  async fetchRanking(asin: string): Promise<ProductRanking> {
    const raw = MOCK_PRODUCT_RANKINGS[asin];
    if (!raw) {
      throw new Error(`No mock ranking for ASIN: ${asin}`);
    }
    return this.parser.parseRanking({ ...raw, observedAt: new Date().toISOString() });
  }

  async fetchReviewStatistics(asin: string): Promise<ReviewStatistics> {
    const raw = MOCK_REVIEW_STATISTICS[asin];
    if (!raw) {
      throw new Error(`No mock review statistics for ASIN: ${asin}`);
    }
    return this.parser.parseReviewStatistics({ ...raw, observedAt: new Date().toISOString() });
  }

  async getPriceHistory(asin: string, _limit?: number): Promise<PriceHistory> {
    const history = MOCK_PRICE_HISTORIES[asin];
    if (!history) {
      throw new Error(`No mock price history for ASIN: ${asin}`);
    }
    return history;
  }
}

export function createMockAmazonDataSource(
  parser?: AmazonProductParser,
): MockAmazonDataSource {
  return new MockAmazonDataSource(parser);
}
