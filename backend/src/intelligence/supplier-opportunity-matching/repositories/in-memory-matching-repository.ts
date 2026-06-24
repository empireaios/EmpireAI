import { randomUUID } from "node:crypto";

import {
  resolveSupplierMatchTier,
  type SupplierOpportunityMatch,
  type SupplierOpportunityMatchCreateInput,
  type SupplierOpportunityMatchUpdateInput,
} from "../models/supplier-opportunity-match.js";
import type {
  MatchingRepository,
  SupplierOpportunityMatchingListQuery,
} from "./matching-repository.js";

function storageKey(workspaceId: string, id: string): string {
  return `${workspaceId}:${id}`;
}

function tripleKey(
  workspaceId: string,
  supplierId: string,
  productId: string,
  opportunityId: string,
): string {
  return `${workspaceId}:${supplierId}:${productId}:${opportunityId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory MatchingRepository for Mission 029 tests and local development. */
export class InMemoryMatchingRepository implements MatchingRepository {
  private readonly store = new Map<string, SupplierOpportunityMatch>();
  private readonly tripleIndex = new Map<string, string>();

  async create(
    workspaceId: string,
    input: SupplierOpportunityMatchCreateInput,
  ): Promise<SupplierOpportunityMatch> {
    const timestamp = nowIso();
    const match: SupplierOpportunityMatch = {
      id: randomUUID(),
      workspaceId,
      supplierId: input.supplierId,
      productId: input.productId,
      opportunityId: input.opportunityId,
      matchScore: input.matchScore,
      matchTier: input.matchTier ?? resolveSupplierMatchTier(input.matchScore),
      confidence: input.confidence,
      strengths: [...input.strengths],
      weaknesses: [...input.weaknesses],
      recommendedUse: input.recommendedUse,
      signals: input.signals.map((signal) => ({ ...signal })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(storageKey(workspaceId, match.id), match);
    this.tripleIndex.set(
      tripleKey(workspaceId, match.supplierId, match.productId, match.opportunityId),
      match.id,
    );
    return structuredClone(match);
  }

  async getById(workspaceId: string, id: string): Promise<SupplierOpportunityMatch | null> {
    const match = this.store.get(storageKey(workspaceId, id));
    return match ? structuredClone(match) : null;
  }

  async getByTriple(
    workspaceId: string,
    supplierId: string,
    productId: string,
    opportunityId: string,
  ): Promise<SupplierOpportunityMatch | null> {
    const id = this.tripleIndex.get(tripleKey(workspaceId, supplierId, productId, opportunityId));
    if (!id) return null;
    return this.getById(workspaceId, id);
  }

  async update(
    workspaceId: string,
    id: string,
    input: SupplierOpportunityMatchUpdateInput,
  ): Promise<SupplierOpportunityMatch> {
    const key = storageKey(workspaceId, id);
    const existing = this.store.get(key);
    if (!existing) {
      throw new Error(`SupplierOpportunityMatch not found: ${id}`);
    }

    const matchScore = input.matchScore ?? existing.matchScore;
    const updated: SupplierOpportunityMatch = {
      ...existing,
      matchScore,
      matchTier: input.matchTier ?? resolveSupplierMatchTier(matchScore),
      confidence: input.confidence ?? existing.confidence,
      strengths: input.strengths ? [...input.strengths] : existing.strengths,
      weaknesses: input.weaknesses ? [...input.weaknesses] : existing.weaknesses,
      recommendedUse: input.recommendedUse ?? existing.recommendedUse,
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
    this.tripleIndex.delete(
      tripleKey(workspaceId, existing.supplierId, existing.productId, existing.opportunityId),
    );
    return true;
  }

  async list(query: SupplierOpportunityMatchingListQuery): Promise<SupplierOpportunityMatch[]> {
    let results = [...this.store.values()].filter(
      (match) => match.workspaceId === query.workspaceId,
    );

    if (query.supplierId) {
      results = results.filter((match) => match.supplierId === query.supplierId);
    }
    if (query.productId) {
      results = results.filter((match) => match.productId === query.productId);
    }
    if (query.opportunityId) {
      results = results.filter((match) => match.opportunityId === query.opportunityId);
    }
    if (query.matchTier) {
      results = results.filter((match) => match.matchTier === query.matchTier);
    }
    if (query.minScore !== undefined) {
      results = results.filter((match) => match.matchScore >= query.minScore!);
    }
    if (query.minConfidence !== undefined) {
      results = results.filter((match) => match.confidence >= query.minConfidence!);
    }

    results.sort(
      (left, right) => right.matchScore - left.matchScore || right.confidence - left.confidence,
    );
    return paginate(results.map((match) => structuredClone(match)), query.limit, query.offset);
  }
}

/** Factory for a fresh in-memory supplier-opportunity matching repository. */
export function createInMemoryMatchingRepository(): InMemoryMatchingRepository {
  return new InMemoryMatchingRepository();
}
