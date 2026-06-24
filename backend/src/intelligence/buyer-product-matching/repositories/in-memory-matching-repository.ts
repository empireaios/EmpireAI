import { randomUUID } from "node:crypto";

import {
  resolveMatchTier,
  type BuyerProductMatch,
  type BuyerProductMatchCreateInput,
  type BuyerProductMatchUpdateInput,
} from "../models/buyer-product-match.js";
import type { MatchingListQuery, MatchingRepository } from "./matching-repository.js";

function storageKey(workspaceId: string, id: string): string {
  return `${workspaceId}:${id}`;
}

function pairKey(workspaceId: string, buyerPersonaId: string, productId: string): string {
  return `${workspaceId}:${buyerPersonaId}:${productId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory MatchingRepository for Mission 025 tests and local development. */
export class InMemoryMatchingRepository implements MatchingRepository {
  private readonly store = new Map<string, BuyerProductMatch>();
  private readonly pairIndex = new Map<string, string>();

  async create(workspaceId: string, input: BuyerProductMatchCreateInput): Promise<BuyerProductMatch> {
    const timestamp = nowIso();
    const match: BuyerProductMatch = {
      id: randomUUID(),
      workspaceId,
      buyerPersonaId: input.buyerPersonaId,
      productId: input.productId,
      score: input.score,
      confidence: input.confidence,
      matchTier: input.matchTier ?? resolveMatchTier(input.score),
      reasons: [...input.reasons],
      matchingSignals: input.matchingSignals.map((signal) => ({ ...signal })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(storageKey(workspaceId, match.id), match);
    this.pairIndex.set(pairKey(workspaceId, match.buyerPersonaId, match.productId), match.id);
    return structuredClone(match);
  }

  async getById(workspaceId: string, id: string): Promise<BuyerProductMatch | null> {
    const match = this.store.get(storageKey(workspaceId, id));
    return match ? structuredClone(match) : null;
  }

  async getByPair(
    workspaceId: string,
    buyerPersonaId: string,
    productId: string,
  ): Promise<BuyerProductMatch | null> {
    const id = this.pairIndex.get(pairKey(workspaceId, buyerPersonaId, productId));
    if (!id) return null;
    return this.getById(workspaceId, id);
  }

  async update(
    workspaceId: string,
    id: string,
    input: BuyerProductMatchUpdateInput,
  ): Promise<BuyerProductMatch> {
    const key = storageKey(workspaceId, id);
    const existing = this.store.get(key);
    if (!existing) {
      throw new Error(`BuyerProductMatch not found: ${id}`);
    }

    const score = input.score ?? existing.score;
    const updated: BuyerProductMatch = {
      ...existing,
      score,
      confidence: input.confidence ?? existing.confidence,
      matchTier: input.matchTier ?? resolveMatchTier(score),
      reasons: input.reasons ? [...input.reasons] : existing.reasons,
      matchingSignals: input.matchingSignals
        ? input.matchingSignals.map((signal) => ({ ...signal }))
        : existing.matchingSignals,
      updatedAt: nowIso(),
    };
    this.store.set(key, updated);
    return structuredClone(updated);
  }

  async delete(workspaceId: string, id: string): Promise<boolean> {
    const existing = this.store.get(storageKey(workspaceId, id));
    if (!existing) return false;

    this.store.delete(storageKey(workspaceId, id));
    this.pairIndex.delete(pairKey(workspaceId, existing.buyerPersonaId, existing.productId));
    return true;
  }

  async list(query: MatchingListQuery): Promise<BuyerProductMatch[]> {
    let results = [...this.store.values()].filter((match) => match.workspaceId === query.workspaceId);

    if (query.buyerPersonaId) {
      results = results.filter((match) => match.buyerPersonaId === query.buyerPersonaId);
    }
    if (query.productId) {
      results = results.filter((match) => match.productId === query.productId);
    }
    if (query.matchTier) {
      results = results.filter((match) => match.matchTier === query.matchTier);
    }
    if (query.minScore !== undefined) {
      results = results.filter((match) => match.score >= query.minScore!);
    }
    if (query.minConfidence !== undefined) {
      results = results.filter((match) => match.confidence >= query.minConfidence!);
    }

    results.sort((left, right) => right.score - left.score || right.confidence - left.confidence);
    return paginate(results.map((match) => structuredClone(match)), query.limit, query.offset);
  }
}

/** Factory for a fresh in-memory matching repository. */
export function createInMemoryMatchingRepository(): InMemoryMatchingRepository {
  return new InMemoryMatchingRepository();
}
