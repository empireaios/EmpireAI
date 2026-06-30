import { randomUUID } from "node:crypto";

import type {
  DomainRecommendation,
  DomainRecommendationCreateInput,
} from "../models/domain-recommendation.js";
import type {
  DomainIntelligenceRepository,
  DomainIntelligenceRepositoryQuery,
} from "./domain-intelligence-repository.js";

function recordKey(workspaceId: string, recommendationId: string): string {
  return `${workspaceId}:domain-recommendation:${recommendationId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

function cloneInput(input: DomainRecommendationCreateInput): DomainRecommendationCreateInput {
  return {
    ...input,
    alternativeDomains: input.alternativeDomains.map((alternative) => ({ ...alternative })),
    signals: input.signals.map((signal) => ({ ...signal })),
  };
}

/** In-memory DomainIntelligenceRepository for Mission 064 tests and local development. */
export class InMemoryDomainIntelligenceRepository implements DomainIntelligenceRepository {
  private readonly store = new Map<string, DomainRecommendation>();
  private readonly brandIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: DomainRecommendationCreateInput,
  ): Promise<DomainRecommendation> {
    const brandKey = `${workspaceId}:${input.brandId}`;
    const existingId = this.brandIndex.get(brandKey);
    const timestamp = nowIso();
    const cloned = cloneInput(input);

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: DomainRecommendation = {
          ...existing,
          ...cloned,
          recommendationId: existing.recommendationId,
          workspaceId: existing.workspaceId,
          createdAt: existing.createdAt,
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        return structuredClone(updated);
      }
    }

    const record: DomainRecommendation = {
      recommendationId: randomUUID(),
      workspaceId,
      ...cloned,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.recommendationId), record);
    this.brandIndex.set(brandKey, record.recommendationId);
    return structuredClone(record);
  }

  async getById(
    workspaceId: string,
    recommendationId: string,
  ): Promise<DomainRecommendation | null> {
    const record = this.store.get(recordKey(workspaceId, recommendationId));
    return record ? structuredClone(record) : null;
  }

  async getByBrand(
    workspaceId: string,
    brandId: string,
  ): Promise<DomainRecommendation | null> {
    const recommendationId = this.brandIndex.get(`${workspaceId}:${brandId}`);
    if (!recommendationId) return null;
    return this.getById(workspaceId, recommendationId);
  }

  async list(query: DomainIntelligenceRepositoryQuery): Promise<DomainRecommendation[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    if (query.brandId) {
      results = results.filter((record) => record.brandId === query.brandId);
    }
    if (query.storeId) {
      results = results.filter((record) => record.storeId === query.storeId);
    }

    results.sort(
      (left, right) =>
        right.updatedAt.localeCompare(left.updatedAt) ||
        left.brandId.localeCompare(right.brandId),
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, recommendationId: string): Promise<boolean> {
    const key = recordKey(workspaceId, recommendationId);
    const existing = this.store.get(key);
    if (!existing) return false;
    this.brandIndex.delete(`${workspaceId}:${existing.brandId}`);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory domain intelligence repository. */
export function createInMemoryDomainIntelligenceRepository(): InMemoryDomainIntelligenceRepository {
  return new InMemoryDomainIntelligenceRepository();
}
