import { randomUUID } from "node:crypto";

import type {
  SupplierConnectorRecord,
  SupplierConnectorRecordCreateInput,
} from "../models/supplier-connector-record.js";
import type { SupplierPlatform } from "../models/supplier-platform.js";
import type {
  SupplierConnectorFrameworkRepository,
  SupplierConnectorFrameworkRepositoryQuery,
} from "./supplier-connector-framework-repository.js";

function recordKey(workspaceId: string, recordId: string): string {
  return `${workspaceId}:supplier-connector:${recordId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

function cloneInput(input: SupplierConnectorRecordCreateInput): SupplierConnectorRecordCreateInput {
  return {
    ...input,
    supplierConnector: {
      ...input.supplierConnector,
      credentialsRequired: [...input.supplierConnector.credentialsRequired],
    },
    supplierHealth: { ...input.supplierHealth },
    supplierCapabilities: input.supplierCapabilities.map((capability) => ({ ...capability })),
    syncMetadata: { ...input.syncMetadata },
    signals: input.signals.map((signal) => ({ ...signal })),
  };
}

/** In-memory SupplierConnectorFrameworkRepository for Mission 066 tests and local development. */
export class InMemorySupplierConnectorFrameworkRepository
  implements SupplierConnectorFrameworkRepository
{
  private readonly store = new Map<string, SupplierConnectorRecord>();
  private readonly platformIndex = new Map<string, string>();
  private readonly connectorIndex = new Map<string, string>();

  private indexKeys(workspaceId: string, record: SupplierConnectorRecord): void {
    this.platformIndex.set(
      `${workspaceId}:${record.supplierConnector.platform}`,
      record.recordId,
    );
    this.connectorIndex.set(
      `${workspaceId}:${record.supplierConnector.connectorId}`,
      record.recordId,
    );
  }

  async save(
    workspaceId: string,
    input: SupplierConnectorRecordCreateInput,
  ): Promise<SupplierConnectorRecord> {
    const platformKey = `${workspaceId}:${input.supplierConnector.platform}`;
    const connectorKey = `${workspaceId}:${input.supplierConnector.connectorId}`;
    const existingId = this.platformIndex.get(platformKey) ?? this.connectorIndex.get(connectorKey);
    const timestamp = nowIso();
    const cloned = cloneInput(input);

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: SupplierConnectorRecord = {
          ...existing,
          ...cloned,
          recordId: existing.recordId,
          workspaceId: existing.workspaceId,
          createdAt: existing.createdAt,
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        this.indexKeys(workspaceId, updated);
        return structuredClone(updated);
      }
    }

    const record: SupplierConnectorRecord = {
      recordId: randomUUID(),
      workspaceId,
      ...cloned,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.recordId), record);
    this.indexKeys(workspaceId, record);
    return structuredClone(record);
  }

  async getById(workspaceId: string, recordId: string): Promise<SupplierConnectorRecord | null> {
    const record = this.store.get(recordKey(workspaceId, recordId));
    return record ? structuredClone(record) : null;
  }

  async getByPlatform(
    workspaceId: string,
    platform: SupplierPlatform,
  ): Promise<SupplierConnectorRecord | null> {
    const recordId = this.platformIndex.get(`${workspaceId}:${platform}`);
    if (!recordId) return null;
    return this.getById(workspaceId, recordId);
  }

  async getByConnectorId(
    workspaceId: string,
    connectorId: string,
  ): Promise<SupplierConnectorRecord | null> {
    const recordId = this.connectorIndex.get(`${workspaceId}:${connectorId}`);
    if (!recordId) return null;
    return this.getById(workspaceId, recordId);
  }

  async list(query: SupplierConnectorFrameworkRepositoryQuery): Promise<SupplierConnectorRecord[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    if (query.platform) {
      results = results.filter(
        (record) => record.supplierConnector.platform === query.platform,
      );
    }
    if (query.connectorId) {
      results = results.filter(
        (record) => record.supplierConnector.connectorId === query.connectorId,
      );
    }

    results.sort(
      (left, right) =>
        right.updatedAt.localeCompare(left.updatedAt) ||
        left.supplierConnector.platform.localeCompare(right.supplierConnector.platform),
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, recordId: string): Promise<boolean> {
    const key = recordKey(workspaceId, recordId);
    const existing = this.store.get(key);
    if (!existing) return false;
    this.platformIndex.delete(`${workspaceId}:${existing.supplierConnector.platform}`);
    this.connectorIndex.delete(`${workspaceId}:${existing.supplierConnector.connectorId}`);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory supplier connector framework repository. */
export function createInMemorySupplierConnectorFrameworkRepository(): InMemorySupplierConnectorFrameworkRepository {
  return new InMemorySupplierConnectorFrameworkRepository();
}
