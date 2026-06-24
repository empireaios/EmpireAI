import { randomUUID } from "node:crypto";

import type {
  ProductTrend,
  ProductTrendCreateInput,
  ProductTrendUpdateInput,
} from "../models/product-trend.js";
import type { TrendListQuery, TrendRepository } from "./trend-repository.js";

function storageKey(workspaceId: string, id: string): string {
  return `${workspaceId}:${id}`;
}

function productKey(workspaceId: string, productId: string): string {
  return `${workspaceId}:${productId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory TrendRepository for Mission 033 tests and local development. */
export class InMemoryTrendRepository implements TrendRepository {
  private readonly store = new Map<string, ProductTrend>();
  private readonly productIndex = new Map<string, string>();

  async save(workspaceId: string, input: ProductTrendCreateInput): Promise<ProductTrend> {
    const existingId = this.productIndex.get(productKey(workspaceId, input.productId));
    if (existingId) {
      return this.update(workspaceId, existingId, input);
    }

    const timestamp = nowIso();
    const trend: ProductTrend = {
      id: randomUUID(),
      workspaceId,
      productId: input.productId,
      trendDirection: input.trendDirection,
      trendVelocity: input.trendVelocity,
      trendStrength: input.trendStrength,
      trendConfidence: input.trendConfidence,
      momentumScore: input.momentumScore,
      volatilityScore: input.volatilityScore,
      snapshotCount: input.snapshotCount,
      signals: input.signals.map((signal) => ({ ...signal })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(storageKey(workspaceId, trend.id), trend);
    this.productIndex.set(productKey(workspaceId, trend.productId), trend.id);
    return structuredClone(trend);
  }

  async getById(workspaceId: string, id: string): Promise<ProductTrend | null> {
    const trend = this.store.get(storageKey(workspaceId, id));
    return trend ? structuredClone(trend) : null;
  }

  async getByProductId(workspaceId: string, productId: string): Promise<ProductTrend | null> {
    const id = this.productIndex.get(productKey(workspaceId, productId));
    if (!id) return null;
    return this.getById(workspaceId, id);
  }

  async update(
    workspaceId: string,
    id: string,
    input: ProductTrendUpdateInput,
  ): Promise<ProductTrend> {
    const key = storageKey(workspaceId, id);
    const existing = this.store.get(key);
    if (!existing) {
      throw new Error(`ProductTrend not found: ${id}`);
    }

    const updated: ProductTrend = {
      ...existing,
      trendDirection: input.trendDirection ?? existing.trendDirection,
      trendVelocity: input.trendVelocity ?? existing.trendVelocity,
      trendStrength: input.trendStrength ?? existing.trendStrength,
      trendConfidence: input.trendConfidence ?? existing.trendConfidence,
      momentumScore: input.momentumScore ?? existing.momentumScore,
      volatilityScore: input.volatilityScore ?? existing.volatilityScore,
      snapshotCount: input.snapshotCount ?? existing.snapshotCount,
      signals: input.signals ? input.signals.map((signal) => ({ ...signal })) : existing.signals,
      updatedAt: nowIso(),
    };
    this.store.set(key, updated);
    return structuredClone(updated);
  }

  async delete(workspaceId: string, id: string): Promise<boolean> {
    const existing = this.store.get(storageKey(workspaceId, id));
    if (!existing) return false;

    this.store.delete(storageKey(workspaceId, id));
    this.productIndex.delete(productKey(workspaceId, existing.productId));
    return true;
  }

  async list(query: TrendListQuery): Promise<ProductTrend[]> {
    let results = [...this.store.values()].filter((trend) => trend.workspaceId === query.workspaceId);

    if (query.productId) {
      results = results.filter((trend) => trend.productId === query.productId);
    }
    if (query.trendDirection) {
      results = results.filter((trend) => trend.trendDirection === query.trendDirection);
    }
    if (query.minMomentumScore !== undefined) {
      results = results.filter((trend) => trend.momentumScore >= query.minMomentumScore!);
    }

    results.sort((left, right) => right.momentumScore - left.momentumScore);
    return paginate(results.map((trend) => structuredClone(trend)), query.limit, query.offset);
  }
}

/** Factory for a fresh in-memory trend repository. */
export function createInMemoryTrendRepository(): InMemoryTrendRepository {
  return new InMemoryTrendRepository();
}
