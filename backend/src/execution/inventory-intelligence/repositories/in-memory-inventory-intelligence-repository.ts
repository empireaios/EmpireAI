import { randomUUID } from "node:crypto";

import type {
  InventoryIntelligenceRecord,
  InventoryIntelligenceRecordCreateInput,
} from "../models/inventory-intelligence-record.js";
import type {
  InventoryIntelligenceRepository,
  InventoryIntelligenceRepositoryQuery,
} from "./inventory-intelligence-repository.js";

function recordKey(workspaceId: string, recordId: string): string {
  return `${workspaceId}:inventory-intelligence:${recordId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory InventoryIntelligenceRepository for Mission 089 tests and local development. */
export class InMemoryInventoryIntelligenceRepository implements InventoryIntelligenceRepository {
  private readonly store = new Map<string, InventoryIntelligenceRecord>();
  private readonly storeIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: InventoryIntelligenceRecordCreateInput,
  ): Promise<InventoryIntelligenceRecord> {
    const storeKey = `${workspaceId}:${input.storeId}`;
    const existingId = this.storeIndex.get(storeKey);
    const timestamp = nowIso();
    const cloned = structuredClone(input);

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: InventoryIntelligenceRecord = {
          ...existing,
          ...cloned,
          recordId: existing.recordId,
          reportId: existing.reportId,
          workspaceId: existing.workspaceId,
          createdAt: existing.createdAt,
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        return structuredClone(updated);
      }
    }

    const reportId = randomUUID();
    const record: InventoryIntelligenceRecord = {
      recordId: randomUUID(),
      reportId,
      workspaceId,
      ...cloned,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.recordId), record);
    this.storeIndex.set(storeKey, record.recordId);
    return structuredClone(record);
  }

  async getById(workspaceId: string, recordId: string): Promise<InventoryIntelligenceRecord | null> {
    const record = this.store.get(recordKey(workspaceId, recordId));
    return record ? structuredClone(record) : null;
  }

  async getByStore(workspaceId: string, storeId: string): Promise<InventoryIntelligenceRecord | null> {
    const recordId = this.storeIndex.get(`${workspaceId}:${storeId}`);
    if (!recordId) return null;
    return this.getById(workspaceId, recordId);
  }

  async list(query: InventoryIntelligenceRepositoryQuery): Promise<InventoryIntelligenceRecord[]> {
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
        right.updatedAt.localeCompare(left.updatedAt) || left.storeId.localeCompare(right.storeId),
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, recordId: string): Promise<boolean> {
    const key = recordKey(workspaceId, recordId);
    const existing = this.store.get(key);
    if (!existing) return false;
    this.storeIndex.delete(`${workspaceId}:${existing.storeId}`);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory inventory intelligence repository. */
export function createInMemoryInventoryIntelligenceRepository(): InMemoryInventoryIntelligenceRepository {
  return new InMemoryInventoryIntelligenceRepository();
}
