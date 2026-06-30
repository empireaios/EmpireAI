import { randomUUID } from "node:crypto";

import type {
  ProductImportRecord,
  ProductImportRecordCreateInput,
} from "../models/product-import-record.js";
import type {
  ProductImportRepository,
  ProductImportRepositoryQuery,
} from "./product-import-repository.js";

function recordKey(workspaceId: string, recordId: string): string {
  return `${workspaceId}:product-import:${recordId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

function cloneInput(input: ProductImportRecordCreateInput): ProductImportRecordCreateInput {
  return {
    ...input,
    importedProducts: input.importedProducts.map((product) => ({ ...product })),
    mappedProducts: input.mappedProducts.map((product) => ({ ...product })),
    signals: input.signals.map((signal) => ({ ...signal })),
  };
}

/** In-memory ProductImportRepository for Mission 068 tests and local development. */
export class InMemoryProductImportRepository implements ProductImportRepository {
  private readonly store = new Map<string, ProductImportRecord>();
  private readonly storeIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: ProductImportRecordCreateInput,
  ): Promise<ProductImportRecord> {
    const storeKey = `${workspaceId}:${input.storeId}`;
    const existingId = this.storeIndex.get(storeKey);
    const timestamp = nowIso();
    const cloned = cloneInput(input);

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: ProductImportRecord = {
          ...existing,
          ...cloned,
          recordId: existing.recordId,
          workspaceId: existing.workspaceId,
          createdAt: existing.createdAt,
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        return structuredClone(updated);
      }
    }

    const record: ProductImportRecord = {
      recordId: randomUUID(),
      workspaceId,
      ...cloned,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.recordId), record);
    this.storeIndex.set(storeKey, record.recordId);
    return structuredClone(record);
  }

  async getById(workspaceId: string, recordId: string): Promise<ProductImportRecord | null> {
    const record = this.store.get(recordKey(workspaceId, recordId));
    return record ? structuredClone(record) : null;
  }

  async getByStore(workspaceId: string, storeId: string): Promise<ProductImportRecord | null> {
    const recordId = this.storeIndex.get(`${workspaceId}:${storeId}`);
    if (!recordId) return null;
    return this.getById(workspaceId, recordId);
  }

  async list(query: ProductImportRepositoryQuery): Promise<ProductImportRecord[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    if (query.storeId) {
      results = results.filter((record) => record.storeId === query.storeId);
    }
    if (query.brandId) {
      results = results.filter((record) => record.brandId === query.brandId);
    }
    if (query.generatedStorefrontId) {
      results = results.filter(
        (record) => record.generatedStorefrontId === query.generatedStorefrontId,
      );
    }
    if (query.catalogStatus) {
      results = results.filter((record) => record.catalogStatus === query.catalogStatus);
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

/** Factory for a fresh in-memory product import repository. */
export function createInMemoryProductImportRepository(): InMemoryProductImportRepository {
  return new InMemoryProductImportRepository();
}
