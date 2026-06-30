import { randomUUID } from "node:crypto";

import type {
  RevenueOpportunity,
  RevenueOpportunityCreateInput,
} from "../models/revenue-opportunity.js";
import type {
  RevenueOpportunityRepository,
  RevenueOpportunityRepositoryQuery,
} from "./revenue-opportunity-repository.js";

function recordKey(workspaceId: string, opportunityId: string): string {
  return `${workspaceId}:revenue:${opportunityId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory RevenueOpportunityRepository for Mission 043 tests and local development. */
export class InMemoryRevenueOpportunityRepository implements RevenueOpportunityRepository {
  private readonly store = new Map<string, RevenueOpportunity>();
  private readonly productIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: RevenueOpportunityCreateInput,
  ): Promise<RevenueOpportunity> {
    const productKey = `${workspaceId}:${input.productId}`;
    const existingId = this.productIndex.get(productKey);
    const timestamp = nowIso();

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: RevenueOpportunity = {
          ...existing,
          opportunityType: input.opportunityType,
          confidence: input.confidence,
          expectedValue: input.expectedValue,
          expectedDifficulty: input.expectedDifficulty,
          recommendedAction: input.recommendedAction,
          reasons: [...input.reasons],
          risks: [...input.risks],
          signals: input.signals.map((signal) => ({ ...signal })),
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        return structuredClone(updated);
      }
    }

    const record: RevenueOpportunity = {
      opportunityId: randomUUID(),
      workspaceId,
      productId: input.productId,
      opportunityType: input.opportunityType,
      confidence: input.confidence,
      expectedValue: input.expectedValue,
      expectedDifficulty: input.expectedDifficulty,
      recommendedAction: input.recommendedAction,
      reasons: [...input.reasons],
      risks: [...input.risks],
      signals: input.signals.map((signal) => ({ ...signal })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.opportunityId), record);
    this.productIndex.set(productKey, record.opportunityId);
    return structuredClone(record);
  }

  async getById(
    workspaceId: string,
    opportunityId: string,
  ): Promise<RevenueOpportunity | null> {
    const record = this.store.get(recordKey(workspaceId, opportunityId));
    return record ? structuredClone(record) : null;
  }

  async getByProduct(
    workspaceId: string,
    productId: string,
  ): Promise<RevenueOpportunity | null> {
    const opportunityId = this.productIndex.get(`${workspaceId}:${productId}`);
    if (!opportunityId) {
      return null;
    }
    return this.getById(workspaceId, opportunityId);
  }

  async list(query: RevenueOpportunityRepositoryQuery): Promise<RevenueOpportunity[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    if (query.productId) {
      results = results.filter((record) => record.productId === query.productId);
    }
    if (query.opportunityType) {
      results = results.filter((record) => record.opportunityType === query.opportunityType);
    }
    if (query.minExpectedValue !== undefined) {
      results = results.filter((record) => record.expectedValue >= query.minExpectedValue!);
    }
    if (query.minConfidence !== undefined) {
      results = results.filter((record) => record.confidence >= query.minConfidence!);
    }

    results.sort(
      (left, right) =>
        right.expectedValue - left.expectedValue ||
        right.confidence - left.confidence ||
        left.productId.localeCompare(right.productId),
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, opportunityId: string): Promise<boolean> {
    const key = recordKey(workspaceId, opportunityId);
    const existing = this.store.get(key);
    if (!existing) {
      return false;
    }
    this.productIndex.delete(`${workspaceId}:${existing.productId}`);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory revenue opportunity repository. */
export function createInMemoryRevenueOpportunityRepository(): InMemoryRevenueOpportunityRepository {
  return new InMemoryRevenueOpportunityRepository();
}
