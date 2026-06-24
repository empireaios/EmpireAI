import { randomUUID } from "node:crypto";

import type { SupplierCapability } from "../models/supplier-capability.js";
import type {
  SupplierProfile,
  SupplierProfileCreateInput,
  SupplierProfileUpdateInput,
} from "../models/supplier-profile.js";
import { scoreSupplierProfile } from "../scoring/supplier-scoring.js";
import type { SupplierListQuery, SupplierRepository } from "./supplier-repository.js";

function storageKey(workspaceId: string, id: string): string {
  return `${workspaceId}:${id}`;
}

function supplierKey(workspaceId: string, supplierId: string): string {
  return `${workspaceId}:${supplierId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

function buildProfile(
  workspaceId: string,
  input: SupplierProfileCreateInput,
): SupplierProfile {
  const timestamp = nowIso();
  const scored = scoreSupplierProfile(input);

  return {
    id: randomUUID(),
    workspaceId,
    supplierId: input.supplierId,
    supplierName: input.supplierName,
    country: input.country,
    categories: [...input.categories],
    fulfillmentScore: input.fulfillmentScore,
    reliabilityScore: input.reliabilityScore,
    communicationScore: input.communicationScore,
    qualityScore: input.qualityScore,
    trustScore: scored.trustScore,
    capability: { ...input.capability },
    riskProfile: { ...scored.riskProfile },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/** In-memory SupplierRepository for Mission 028 tests and local development. */
export class InMemorySupplierRepository implements SupplierRepository {
  private readonly store = new Map<string, SupplierProfile>();
  private readonly supplierIndex = new Map<string, string>();

  async create(workspaceId: string, input: SupplierProfileCreateInput): Promise<SupplierProfile> {
    const profile = buildProfile(workspaceId, input);
    this.store.set(storageKey(workspaceId, profile.id), profile);
    this.supplierIndex.set(supplierKey(workspaceId, profile.supplierId), profile.id);
    return structuredClone(profile);
  }

  async getById(workspaceId: string, id: string): Promise<SupplierProfile | null> {
    const profile = this.store.get(storageKey(workspaceId, id));
    return profile ? structuredClone(profile) : null;
  }

  async getBySupplierId(workspaceId: string, supplierId: string): Promise<SupplierProfile | null> {
    const id = this.supplierIndex.get(supplierKey(workspaceId, supplierId));
    if (!id) return null;
    return this.getById(workspaceId, id);
  }

  async update(
    workspaceId: string,
    id: string,
    input: SupplierProfileUpdateInput,
  ): Promise<SupplierProfile> {
    const key = storageKey(workspaceId, id);
    const existing = this.store.get(key);
    if (!existing) {
      throw new Error(`SupplierProfile not found: ${id}`);
    }

    const merged: SupplierProfileCreateInput = {
      supplierId: existing.supplierId,
      supplierName: input.supplierName ?? existing.supplierName,
      country: input.country ?? existing.country,
      categories: input.categories ? [...input.categories] : [...existing.categories],
      fulfillmentScore: input.fulfillmentScore ?? existing.fulfillmentScore,
      reliabilityScore: input.reliabilityScore ?? existing.reliabilityScore,
      communicationScore: input.communicationScore ?? existing.communicationScore,
      qualityScore: input.qualityScore ?? existing.qualityScore,
      capability: input.capability
        ? { ...(input.capability as SupplierCapability) }
        : { ...existing.capability },
    };

    const scored = scoreSupplierProfile(merged);
    const updated: SupplierProfile = {
      ...existing,
      ...merged,
      trustScore: scored.trustScore,
      riskProfile: { ...scored.riskProfile },
      updatedAt: nowIso(),
    };
    this.store.set(key, updated);
    return structuredClone(updated);
  }

  async delete(workspaceId: string, id: string): Promise<boolean> {
    const existing = this.store.get(storageKey(workspaceId, id));
    if (!existing) return false;

    this.store.delete(storageKey(workspaceId, id));
    this.supplierIndex.delete(supplierKey(workspaceId, existing.supplierId));
    return true;
  }

  async list(query: SupplierListQuery): Promise<SupplierProfile[]> {
    let results = [...this.store.values()].filter(
      (profile) => profile.workspaceId === query.workspaceId,
    );

    if (query.supplierId) {
      results = results.filter((profile) => profile.supplierId === query.supplierId);
    }
    if (query.country) {
      results = results.filter((profile) => profile.country === query.country);
    }
    if (query.category) {
      results = results.filter((profile) => profile.categories.includes(query.category!));
    }
    if (query.minTrustScore !== undefined) {
      results = results.filter((profile) => profile.trustScore >= query.minTrustScore!);
    }
    if (query.riskLevel) {
      results = results.filter((profile) => profile.riskProfile.riskLevel === query.riskLevel);
    }

    results.sort((left, right) => right.trustScore - left.trustScore);
    return paginate(results.map((profile) => structuredClone(profile)), query.limit, query.offset);
  }
}

/** Factory for a fresh in-memory supplier repository. */
export function createInMemorySupplierRepository(): InMemorySupplierRepository {
  return new InMemorySupplierRepository();
}
