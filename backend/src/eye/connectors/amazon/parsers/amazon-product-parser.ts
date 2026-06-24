import type { AmazonProduct, AmazonProductQuery } from "../models/amazon-product.js";
import type { ProductRanking } from "../models/product-ranking.js";
import type { ReviewStatistics } from "../models/review-statistics.js";

/** Parses raw Amazon product data into typed models — future live impl swaps here. */
export interface AmazonProductParser {
  parseProduct(raw: unknown): AmazonProduct;
  parseRanking(raw: unknown): ProductRanking;
  parseReviewStatistics(raw: unknown): ReviewStatistics;
}

export interface AmazonProductDataSource {
  fetchProduct(query: AmazonProductQuery): Promise<AmazonProduct>;
  fetchRanking(asin: string): Promise<ProductRanking>;
  fetchReviewStatistics(asin: string): Promise<ReviewStatistics>;
}

export class MockAmazonProductParser implements AmazonProductParser {
  parseProduct(raw: unknown): AmazonProduct {
    if (!raw || typeof raw !== "object") {
      throw new Error("Invalid Amazon product payload");
    }
    const data = raw as AmazonProduct;
    if (!data.asin || !data.title) {
      throw new Error("Amazon product missing required fields (asin, title)");
    }
    return data;
  }

  parseRanking(raw: unknown): ProductRanking {
    if (!raw || typeof raw !== "object") {
      throw new Error("Invalid Amazon ranking payload");
    }
    const data = raw as ProductRanking;
    if (!data.asin) {
      throw new Error("Amazon ranking missing asin");
    }
    return data;
  }

  parseReviewStatistics(raw: unknown): ReviewStatistics {
    if (!raw || typeof raw !== "object") {
      throw new Error("Invalid Amazon review statistics payload");
    }
    const data = raw as ReviewStatistics;
    if (!data.asin) {
      throw new Error("Amazon review statistics missing asin");
    }
    return data;
  }
}
