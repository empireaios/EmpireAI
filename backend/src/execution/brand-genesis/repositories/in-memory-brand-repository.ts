import { randomUUID } from "node:crypto";

import type { BrandProfile, BrandProfileCreateInput } from "../models/brand-profile.js";
import type { BrandRepository, BrandRepositoryQuery } from "./brand-repository.js";

function recordKey(workspaceId: string, brandId: string): string {
  return `${workspaceId}:brand:${brandId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory BrandRepository for Mission 046 tests and local development. */
export class InMemoryBrandRepository implements BrandRepository {
  private readonly store = new Map<string, BrandProfile>();
  private readonly opportunityIndex = new Map<string, string>();

  async save(workspaceId: string, input: BrandProfileCreateInput): Promise<BrandProfile> {
    const opportunityKey = `${workspaceId}:${input.opportunityId}`;
    const existingId = this.opportunityIndex.get(opportunityKey);
    const timestamp = nowIso();

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: BrandProfile = {
          ...existing,
          portfolioEntryId: input.portfolioEntryId,
          allocationId: input.allocationId,
          brandName: input.brandName,
          slogan: input.slogan,
          niche: input.niche,
          targetAudience: input.targetAudience,
          positioning: input.positioning,
          valueProposition: input.valueProposition,
          recommendedProducts: [...input.recommendedProducts],
          confidence: input.confidence,
          identity: { ...input.identity },
          positioningProfile: {
            ...input.positioningProfile,
            recommendedProducts: [...input.positioningProfile.recommendedProducts],
          },
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        return structuredClone(updated);
      }
    }

    const record: BrandProfile = {
      brandId: randomUUID(),
      workspaceId,
      opportunityId: input.opportunityId,
      productId: input.productId,
      portfolioEntryId: input.portfolioEntryId,
      allocationId: input.allocationId,
      brandName: input.brandName,
      slogan: input.slogan,
      niche: input.niche,
      targetAudience: input.targetAudience,
      positioning: input.positioning,
      valueProposition: input.valueProposition,
      recommendedProducts: [...input.recommendedProducts],
      confidence: input.confidence,
      identity: { ...input.identity },
      positioningProfile: {
        ...input.positioningProfile,
        recommendedProducts: [...input.positioningProfile.recommendedProducts],
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.brandId), record);
    this.opportunityIndex.set(opportunityKey, record.brandId);
    return structuredClone(record);
  }

  async getById(workspaceId: string, brandId: string): Promise<BrandProfile | null> {
    const record = this.store.get(recordKey(workspaceId, brandId));
    return record ? structuredClone(record) : null;
  }

  async getByOpportunity(
    workspaceId: string,
    opportunityId: string,
  ): Promise<BrandProfile | null> {
    const brandId = this.opportunityIndex.get(`${workspaceId}:${opportunityId}`);
    if (!brandId) {
      return null;
    }
    return this.getById(workspaceId, brandId);
  }

  async list(query: BrandRepositoryQuery): Promise<BrandProfile[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    if (query.opportunityId) {
      results = results.filter((record) => record.opportunityId === query.opportunityId);
    }
    if (query.productId) {
      results = results.filter((record) => record.productId === query.productId);
    }
    if (query.minConfidence !== undefined) {
      results = results.filter((record) => record.confidence >= query.minConfidence!);
    }

    results.sort(
      (left, right) =>
        right.confidence - left.confidence || left.brandName.localeCompare(right.brandName),
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, brandId: string): Promise<boolean> {
    const key = recordKey(workspaceId, brandId);
    const existing = this.store.get(key);
    if (!existing) {
      return false;
    }
    this.opportunityIndex.delete(`${workspaceId}:${existing.opportunityId}`);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory brand repository. */
export function createInMemoryBrandRepository(): InMemoryBrandRepository {
  return new InMemoryBrandRepository();
}
