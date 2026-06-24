import { randomUUID } from "node:crypto";

import {
  resolveOpportunityTier,
  type ProductOpportunity,
  type ProductOpportunityCreateInput,
  type ProductOpportunityUpdateInput,
} from "../models/product-opportunity.js";
import type { OpportunityListQuery, OpportunityRepository } from "./opportunity-repository.js";

function storageKey(workspaceId: string, id: string): string {
  return `${workspaceId}:${id}`;
}

function pairKey(workspaceId: string, productId: string, buyerPersonaId: string): string {
  return `${workspaceId}:${productId}:${buyerPersonaId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory OpportunityRepository for Mission 027 tests and local development. */
export class InMemoryOpportunityRepository implements OpportunityRepository {
  private readonly store = new Map<string, ProductOpportunity>();
  private readonly pairIndex = new Map<string, string>();

  async create(
    workspaceId: string,
    input: ProductOpportunityCreateInput,
  ): Promise<ProductOpportunity> {
    const timestamp = nowIso();
    const opportunity: ProductOpportunity = {
      id: randomUUID(),
      workspaceId,
      productId: input.productId,
      buyerPersonaId: input.buyerPersonaId,
      opportunityScore: input.opportunityScore,
      opportunityTier: input.opportunityTier ?? resolveOpportunityTier(input.opportunityScore),
      confidence: input.confidence,
      reasoning: input.reasoning,
      strengths: [...input.strengths],
      weaknesses: [...input.weaknesses],
      recommendedChannels: [...input.recommendedChannels],
      signals: input.signals.map((signal) => ({ ...signal })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(storageKey(workspaceId, opportunity.id), opportunity);
    this.pairIndex.set(pairKey(workspaceId, opportunity.productId, opportunity.buyerPersonaId), opportunity.id);
    return structuredClone(opportunity);
  }

  async getById(workspaceId: string, id: string): Promise<ProductOpportunity | null> {
    const opportunity = this.store.get(storageKey(workspaceId, id));
    return opportunity ? structuredClone(opportunity) : null;
  }

  async getByPair(
    workspaceId: string,
    productId: string,
    buyerPersonaId: string,
  ): Promise<ProductOpportunity | null> {
    const id = this.pairIndex.get(pairKey(workspaceId, productId, buyerPersonaId));
    if (!id) return null;
    return this.getById(workspaceId, id);
  }

  async update(
    workspaceId: string,
    id: string,
    input: ProductOpportunityUpdateInput,
  ): Promise<ProductOpportunity> {
    const key = storageKey(workspaceId, id);
    const existing = this.store.get(key);
    if (!existing) {
      throw new Error(`ProductOpportunity not found: ${id}`);
    }

    const opportunityScore = input.opportunityScore ?? existing.opportunityScore;
    const updated: ProductOpportunity = {
      ...existing,
      opportunityScore,
      opportunityTier: input.opportunityTier ?? resolveOpportunityTier(opportunityScore),
      confidence: input.confidence ?? existing.confidence,
      reasoning: input.reasoning ?? existing.reasoning,
      strengths: input.strengths ? [...input.strengths] : existing.strengths,
      weaknesses: input.weaknesses ? [...input.weaknesses] : existing.weaknesses,
      recommendedChannels: input.recommendedChannels
        ? [...input.recommendedChannels]
        : existing.recommendedChannels,
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
    this.pairIndex.delete(pairKey(workspaceId, existing.productId, existing.buyerPersonaId));
    return true;
  }

  async list(query: OpportunityListQuery): Promise<ProductOpportunity[]> {
    let results = [...this.store.values()].filter(
      (opportunity) => opportunity.workspaceId === query.workspaceId,
    );

    if (query.productId) {
      results = results.filter((opportunity) => opportunity.productId === query.productId);
    }
    if (query.buyerPersonaId) {
      results = results.filter((opportunity) => opportunity.buyerPersonaId === query.buyerPersonaId);
    }
    if (query.opportunityTier) {
      results = results.filter((opportunity) => opportunity.opportunityTier === query.opportunityTier);
    }
    if (query.minScore !== undefined) {
      results = results.filter((opportunity) => opportunity.opportunityScore >= query.minScore!);
    }
    if (query.minConfidence !== undefined) {
      results = results.filter((opportunity) => opportunity.confidence >= query.minConfidence!);
    }

    results.sort(
      (left, right) =>
        right.opportunityScore - left.opportunityScore || right.confidence - left.confidence,
    );
    return paginate(results.map((opportunity) => structuredClone(opportunity)), query.limit, query.offset);
  }
}

/** Factory for a fresh in-memory opportunity repository. */
export function createInMemoryOpportunityRepository(): InMemoryOpportunityRepository {
  return new InMemoryOpportunityRepository();
}
