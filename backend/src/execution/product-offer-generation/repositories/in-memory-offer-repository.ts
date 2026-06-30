import { randomUUID } from "node:crypto";

import type { ProductOffer, ProductOfferCreateInput } from "../models/product-offer.js";
import type { OfferRepository, OfferRepositoryQuery } from "./offer-repository.js";

function recordKey(workspaceId: string, offerId: string): string {
  return `${workspaceId}:offer:${offerId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory OfferRepository for Mission 048 tests and local development. */
export class InMemoryOfferRepository implements OfferRepository {
  private readonly store = new Map<string, ProductOffer>();
  private readonly productIndex = new Map<string, string>();

  async save(workspaceId: string, input: ProductOfferCreateInput): Promise<ProductOffer> {
    const productKey = `${workspaceId}:${input.productId}`;
    const existingId = this.productIndex.get(productKey);
    const timestamp = nowIso();

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: ProductOffer = {
          ...existing,
          brandId: input.brandId,
          offerStyle: input.offerStyle,
          offerTitle: input.offerTitle,
          headline: input.headline,
          valueProposition: input.valueProposition,
          keyBenefits: [...input.keyBenefits],
          keyFeatures: [...input.keyFeatures],
          customerProblem: input.customerProblem,
          customerOutcome: input.customerOutcome,
          callToAction: input.callToAction,
          confidence: input.confidence,
          signals: input.signals.map((signal) => ({ ...signal })),
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        return structuredClone(updated);
      }
    }

    const record: ProductOffer = {
      offerId: randomUUID(),
      workspaceId,
      brandId: input.brandId,
      productId: input.productId,
      offerStyle: input.offerStyle,
      offerTitle: input.offerTitle,
      headline: input.headline,
      valueProposition: input.valueProposition,
      keyBenefits: [...input.keyBenefits],
      keyFeatures: [...input.keyFeatures],
      customerProblem: input.customerProblem,
      customerOutcome: input.customerOutcome,
      callToAction: input.callToAction,
      confidence: input.confidence,
      signals: input.signals.map((signal) => ({ ...signal })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.offerId), record);
    this.productIndex.set(productKey, record.offerId);
    return structuredClone(record);
  }

  async getById(workspaceId: string, offerId: string): Promise<ProductOffer | null> {
    const record = this.store.get(recordKey(workspaceId, offerId));
    return record ? structuredClone(record) : null;
  }

  async getByProduct(workspaceId: string, productId: string): Promise<ProductOffer | null> {
    const offerId = this.productIndex.get(`${workspaceId}:${productId}`);
    if (!offerId) {
      return null;
    }
    return this.getById(workspaceId, offerId);
  }

  async list(query: OfferRepositoryQuery): Promise<ProductOffer[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    if (query.brandId) {
      results = results.filter((record) => record.brandId === query.brandId);
    }
    if (query.productId) {
      results = results.filter((record) => record.productId === query.productId);
    }
    if (query.offerStyle) {
      results = results.filter((record) => record.offerStyle === query.offerStyle);
    }
    if (query.minConfidence !== undefined) {
      results = results.filter((record) => record.confidence >= query.minConfidence!);
    }

    results.sort(
      (left, right) =>
        right.confidence - left.confidence || left.offerTitle.localeCompare(right.offerTitle),
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, offerId: string): Promise<boolean> {
    const key = recordKey(workspaceId, offerId);
    const existing = this.store.get(key);
    if (!existing) {
      return false;
    }
    this.productIndex.delete(`${workspaceId}:${existing.productId}`);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory offer repository. */
export function createInMemoryOfferRepository(): InMemoryOfferRepository {
  return new InMemoryOfferRepository();
}
