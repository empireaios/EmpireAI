import { randomUUID } from "node:crypto";

import type {
  SupplierProductSyncRecord,
  SupplierProductSyncRecordCreateInput,
} from "../models/supplier-product-sync-record.js";
import type {
  SupplierProductSyncRepository,
  SupplierProductSyncRepositoryQuery,
} from "./supplier-product-sync-repository.js";

function recordKey(workspaceId: string, recordId: string): string {
  return `${workspaceId}:supplier-product-sync:${recordId}`;
}

function skuKey(workspaceId: string, connectorId: string, supplierSku: string): string {
  return `${workspaceId}:${connectorId}:${supplierSku}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

function cloneInput(
  input: SupplierProductSyncRecordCreateInput,
): SupplierProductSyncRecordCreateInput {
  return {
    ...input,
    supplierProduct: { ...input.supplierProduct, tags: [...input.supplierProduct.tags] },
    supplierInventory: { ...input.supplierInventory },
    supplierPricing: { ...input.supplierPricing },
    supplierShippingData: {
      ...input.supplierShippingData,
      methods: input.supplierShippingData.methods.map((method) => ({
        ...method,
        regions: [...method.regions],
      })),
    },
    signals: input.signals.map((signal) => ({ ...signal })),
  };
}

/** In-memory SupplierProductSyncRepository for Mission 067 tests and local development. */
export class InMemorySupplierProductSyncRepository implements SupplierProductSyncRepository {
  private readonly store = new Map<string, SupplierProductSyncRecord>();
  private readonly skuIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: SupplierProductSyncRecordCreateInput,
  ): Promise<SupplierProductSyncRecord> {
    const key = skuKey(
      workspaceId,
      input.supplierProduct.connectorId,
      input.supplierProduct.supplierSku,
    );
    const existingId = this.skuIndex.get(key);
    const timestamp = nowIso();
    const cloned = cloneInput(input);

    if (existingId) {
      const recordKeyValue = recordKey(workspaceId, existingId);
      const existing = this.store.get(recordKeyValue);
      if (existing) {
        const updated: SupplierProductSyncRecord = {
          ...existing,
          ...cloned,
          recordId: existing.recordId,
          workspaceId: existing.workspaceId,
          createdAt: existing.createdAt,
          updatedAt: timestamp,
        };
        this.store.set(recordKeyValue, updated);
        return structuredClone(updated);
      }
    }

    const record: SupplierProductSyncRecord = {
      recordId: randomUUID(),
      workspaceId,
      ...cloned,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.recordId), record);
    this.skuIndex.set(key, record.recordId);
    return structuredClone(record);
  }

  async getById(
    workspaceId: string,
    recordId: string,
  ): Promise<SupplierProductSyncRecord | null> {
    const record = this.store.get(recordKey(workspaceId, recordId));
    return record ? structuredClone(record) : null;
  }

  async getBySupplierSku(
    workspaceId: string,
    connectorId: string,
    supplierSku: string,
  ): Promise<SupplierProductSyncRecord | null> {
    const recordId = this.skuIndex.get(skuKey(workspaceId, connectorId, supplierSku));
    if (!recordId) return null;
    return this.getById(workspaceId, recordId);
  }

  async list(query: SupplierProductSyncRepositoryQuery): Promise<SupplierProductSyncRecord[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    if (query.connectorId) {
      results = results.filter(
        (record) => record.supplierProduct.connectorId === query.connectorId,
      );
    }
    if (query.platform) {
      results = results.filter((record) => record.supplierProduct.platform === query.platform);
    }
    if (query.supplierSku) {
      results = results.filter(
        (record) => record.supplierProduct.supplierSku === query.supplierSku,
      );
    }
    if (query.productEntityId) {
      results = results.filter(
        (record) => record.supplierProduct.productEntityId === query.productEntityId,
      );
    }

    results.sort(
      (left, right) =>
        right.updatedAt.localeCompare(left.updatedAt) ||
        left.supplierProduct.supplierSku.localeCompare(right.supplierProduct.supplierSku),
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, recordId: string): Promise<boolean> {
    const key = recordKey(workspaceId, recordId);
    const existing = this.store.get(key);
    if (!existing) return false;
    this.skuIndex.delete(
      skuKey(
        workspaceId,
        existing.supplierProduct.connectorId,
        existing.supplierProduct.supplierSku,
      ),
    );
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory supplier product sync repository. */
export function createInMemorySupplierProductSyncRepository(): InMemorySupplierProductSyncRepository {
  return new InMemorySupplierProductSyncRepository();
}
