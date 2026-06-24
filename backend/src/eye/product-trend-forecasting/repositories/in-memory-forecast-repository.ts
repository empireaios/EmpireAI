import { randomUUID } from "node:crypto";

import type {
  ProductTrendForecast,
  ProductTrendForecastCreateInput,
  ProductTrendForecastUpdateInput,
} from "../models/product-trend-forecast.js";
import type { ForecastListQuery, ForecastRepository } from "./forecast-repository.js";

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

/** In-memory ForecastRepository for Mission 034 tests and local development. */
export class InMemoryForecastRepository implements ForecastRepository {
  private readonly store = new Map<string, ProductTrendForecast>();
  private readonly productIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: ProductTrendForecastCreateInput,
  ): Promise<ProductTrendForecast> {
    const existingId = this.productIndex.get(productKey(workspaceId, input.productId));
    if (existingId) {
      return this.update(workspaceId, existingId, input);
    }

    const timestamp = nowIso();
    const forecast: ProductTrendForecast = {
      id: randomUUID(),
      workspaceId,
      productId: input.productId,
      trendId: input.trendId,
      forecastDirection: input.forecastDirection,
      forecastConfidence: input.forecastConfidence,
      momentumProjection: input.momentumProjection,
      riskProjection: input.riskProjection,
      opportunityProjection: input.opportunityProjection,
      recommendedAction: input.recommendedAction,
      signals: input.signals.map((signal) => ({ ...signal })),
      snapshotCount: input.snapshotCount,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(storageKey(workspaceId, forecast.id), forecast);
    this.productIndex.set(productKey(workspaceId, forecast.productId), forecast.id);
    return structuredClone(forecast);
  }

  async getById(workspaceId: string, id: string): Promise<ProductTrendForecast | null> {
    const forecast = this.store.get(storageKey(workspaceId, id));
    return forecast ? structuredClone(forecast) : null;
  }

  async getByProductId(workspaceId: string, productId: string): Promise<ProductTrendForecast | null> {
    const id = this.productIndex.get(productKey(workspaceId, productId));
    if (!id) return null;
    return this.getById(workspaceId, id);
  }

  async update(
    workspaceId: string,
    id: string,
    input: ProductTrendForecastUpdateInput,
  ): Promise<ProductTrendForecast> {
    const key = storageKey(workspaceId, id);
    const existing = this.store.get(key);
    if (!existing) {
      throw new Error(`ProductTrendForecast not found: ${id}`);
    }

    const updated: ProductTrendForecast = {
      ...existing,
      forecastDirection: input.forecastDirection ?? existing.forecastDirection,
      forecastConfidence: input.forecastConfidence ?? existing.forecastConfidence,
      momentumProjection: input.momentumProjection ?? existing.momentumProjection,
      riskProjection: input.riskProjection ?? existing.riskProjection,
      opportunityProjection: input.opportunityProjection ?? existing.opportunityProjection,
      recommendedAction: input.recommendedAction ?? existing.recommendedAction,
      signals: input.signals ? input.signals.map((signal) => ({ ...signal })) : existing.signals,
      snapshotCount: input.snapshotCount ?? existing.snapshotCount,
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

  async list(query: ForecastListQuery): Promise<ProductTrendForecast[]> {
    let results = [...this.store.values()].filter(
      (forecast) => forecast.workspaceId === query.workspaceId,
    );

    if (query.productId) {
      results = results.filter((forecast) => forecast.productId === query.productId);
    }
    if (query.trendId) {
      results = results.filter((forecast) => forecast.trendId === query.trendId);
    }
    if (query.forecastDirection) {
      results = results.filter((forecast) => forecast.forecastDirection === query.forecastDirection);
    }
    if (query.recommendedAction) {
      results = results.filter(
        (forecast) => forecast.recommendedAction === query.recommendedAction,
      );
    }
    if (query.minConfidence !== undefined) {
      results = results.filter((forecast) => forecast.forecastConfidence >= query.minConfidence!);
    }

    results.sort(
      (left, right) =>
        right.opportunityProjection - left.opportunityProjection ||
        right.forecastConfidence - left.forecastConfidence,
    );
    return paginate(results.map((forecast) => structuredClone(forecast)), query.limit, query.offset);
  }
}

/** Factory for a fresh in-memory forecast repository. */
export function createInMemoryForecastRepository(): InMemoryForecastRepository {
  return new InMemoryForecastRepository();
}
