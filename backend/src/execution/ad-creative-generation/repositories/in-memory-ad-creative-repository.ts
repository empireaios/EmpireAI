import { randomUUID } from "node:crypto";

import type {
  AdCreativeRecord,
  AdCreativeRecordCreateInput,
} from "../models/ad-creative-record.js";
import type {
  AdCreativeRepository,
  AdCreativeRepositoryQuery,
} from "./ad-creative-repository.js";

function recordKey(workspaceId: string, recordId: string): string {
  return `${workspaceId}:ad-creative:${recordId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory AdCreativeRepository for Mission 078 tests and local development. */
export class InMemoryAdCreativeRepository implements AdCreativeRepository {
  private readonly store = new Map<string, AdCreativeRecord>();
  private readonly brandIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: AdCreativeRecordCreateInput,
  ): Promise<AdCreativeRecord> {
    const brandKey = `${workspaceId}:${input.brandId}`;
    const existingId = this.brandIndex.get(brandKey);
    const timestamp = nowIso();
    const cloned = structuredClone(input);

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: AdCreativeRecord = {
          ...existing,
          ...cloned,
          recordId: existing.recordId,
          packageId: existing.packageId,
          workspaceId: existing.workspaceId,
          createdAt: existing.createdAt,
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        return structuredClone(updated);
      }
    }

    const packageId = randomUUID();
    const record: AdCreativeRecord = {
      recordId: randomUUID(),
      packageId,
      workspaceId,
      ...cloned,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.recordId), record);
    this.brandIndex.set(brandKey, record.recordId);
    return structuredClone(record);
  }

  async getById(workspaceId: string, recordId: string): Promise<AdCreativeRecord | null> {
    const record = this.store.get(recordKey(workspaceId, recordId));
    return record ? structuredClone(record) : null;
  }

  async getByBrand(workspaceId: string, brandId: string): Promise<AdCreativeRecord | null> {
    const recordId = this.brandIndex.get(`${workspaceId}:${brandId}`);
    if (!recordId) return null;
    return this.getById(workspaceId, recordId);
  }

  async list(query: AdCreativeRepositoryQuery): Promise<AdCreativeRecord[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    if (query.brandId) {
      results = results.filter((record) => record.brandId === query.brandId);
    }
    if (query.storeId) {
      results = results.filter((record) => record.storeId === query.storeId);
    }
    if (query.campaignId) {
      results = results.filter((record) => record.campaignId === query.campaignId);
    }

    results.sort(
      (left, right) =>
        right.updatedAt.localeCompare(left.updatedAt) || left.brandId.localeCompare(right.brandId),
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, recordId: string): Promise<boolean> {
    const key = recordKey(workspaceId, recordId);
    const existing = this.store.get(key);
    if (!existing) return false;
    this.brandIndex.delete(`${workspaceId}:${existing.brandId}`);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory ad creative repository. */
export function createInMemoryAdCreativeRepository(): InMemoryAdCreativeRepository {
  return new InMemoryAdCreativeRepository();
}
