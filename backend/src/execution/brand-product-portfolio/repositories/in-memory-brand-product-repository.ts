import { randomUUID } from "node:crypto";

import type {
  BrandProductPortfolio,
  BrandProductPortfolioCreateInput,
} from "../models/brand-product-portfolio.js";
import type {
  BrandProductRepository,
  BrandProductRepositoryQuery,
} from "./brand-product-repository.js";

function recordKey(workspaceId: string, portfolioId: string): string {
  return `${workspaceId}:brand-product-portfolio:${portfolioId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory BrandProductRepository for Mission 047 tests and local development. */
export class InMemoryBrandProductRepository implements BrandProductRepository {
  private readonly store = new Map<string, BrandProductPortfolio>();
  private readonly brandIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: BrandProductPortfolioCreateInput,
  ): Promise<BrandProductPortfolio> {
    const brandKey = `${workspaceId}:${input.brandId}`;
    const existingId = this.brandIndex.get(brandKey);
    const timestamp = nowIso();

    const cloneProducts = <T extends { displayName: string }>(items: T[]): T[] =>
      items.map((item) => ({ ...item }));

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: BrandProductPortfolio = {
          ...existing,
          recommendedProducts: cloneProducts(input.recommendedProducts),
          heroProducts: cloneProducts(input.heroProducts),
          supportingProducts: cloneProducts(input.supportingProducts),
          bundleProducts: cloneProducts(input.bundleProducts),
          portfolioScore: input.portfolioScore,
          confidence: input.confidence,
          signals: input.signals.map((signal) => ({ ...signal })),
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        return structuredClone(updated);
      }
    }

    const record: BrandProductPortfolio = {
      portfolioId: randomUUID(),
      workspaceId,
      brandId: input.brandId,
      recommendedProducts: cloneProducts(input.recommendedProducts),
      heroProducts: cloneProducts(input.heroProducts),
      supportingProducts: cloneProducts(input.supportingProducts),
      bundleProducts: cloneProducts(input.bundleProducts),
      portfolioScore: input.portfolioScore,
      confidence: input.confidence,
      signals: input.signals.map((signal) => ({ ...signal })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.portfolioId), record);
    this.brandIndex.set(brandKey, record.portfolioId);
    return structuredClone(record);
  }

  async getById(
    workspaceId: string,
    portfolioId: string,
  ): Promise<BrandProductPortfolio | null> {
    const record = this.store.get(recordKey(workspaceId, portfolioId));
    return record ? structuredClone(record) : null;
  }

  async getByBrand(
    workspaceId: string,
    brandId: string,
  ): Promise<BrandProductPortfolio | null> {
    const portfolioId = this.brandIndex.get(`${workspaceId}:${brandId}`);
    if (!portfolioId) {
      return null;
    }
    return this.getById(workspaceId, portfolioId);
  }

  async list(query: BrandProductRepositoryQuery): Promise<BrandProductPortfolio[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    if (query.brandId) {
      results = results.filter((record) => record.brandId === query.brandId);
    }
    if (query.minPortfolioScore !== undefined) {
      results = results.filter((record) => record.portfolioScore >= query.minPortfolioScore!);
    }
    if (query.minConfidence !== undefined) {
      results = results.filter((record) => record.confidence >= query.minConfidence!);
    }

    results.sort(
      (left, right) =>
        right.portfolioScore - left.portfolioScore ||
        right.confidence - left.confidence,
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, portfolioId: string): Promise<boolean> {
    const key = recordKey(workspaceId, portfolioId);
    const existing = this.store.get(key);
    if (!existing) {
      return false;
    }
    this.brandIndex.delete(`${workspaceId}:${existing.brandId}`);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory brand product repository. */
export function createInMemoryBrandProductRepository(): InMemoryBrandProductRepository {
  return new InMemoryBrandProductRepository();
}
