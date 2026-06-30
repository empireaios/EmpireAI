import { randomUUID } from "node:crypto";

import type {
  CompanyManufacturingRecord,
  CompanyManufacturingRecordCreateInput,
} from "../models/company-manufacturing-record.js";
import type {
  CompanyManufacturingRepository,
  CompanyManufacturingRepositoryQuery,
} from "./company-manufacturing-repository.js";

function recordKey(workspaceId: string, recordId: string): string {
  return `${workspaceId}:company-manufacturing:${recordId}`;
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
  input: CompanyManufacturingRecordCreateInput,
): CompanyManufacturingRecordCreateInput {
  return {
    ...input,
    stages: input.stages.map((stage) => ({ ...stage })),
    nextActions: input.nextActions.map((action) => ({ ...action })),
    signals: input.signals.map((signal) => ({ ...signal })),
  };
}

/** In-memory CompanyManufacturingRepository for Mission 072 tests and local development. */
export class InMemoryCompanyManufacturingRepository implements CompanyManufacturingRepository {
  private readonly store = new Map<string, CompanyManufacturingRecord>();
  private readonly latestIndex = new Map<string, string>();
  private readonly productIndex = new Map<string, string>();

  private indexRecord(workspaceId: string, record: CompanyManufacturingRecord): void {
    this.latestIndex.set(workspaceId, record.recordId);
    this.productIndex.set(`${workspaceId}:${record.productId}`, record.recordId);
  }

  async save(
    workspaceId: string,
    input: CompanyManufacturingRecordCreateInput,
  ): Promise<CompanyManufacturingRecord> {
    const timestamp = nowIso();
    const cloned = cloneInput(input);
    const runId = randomUUID();
    const record: CompanyManufacturingRecord = {
      recordId: randomUUID(),
      runId,
      workspaceId,
      ...cloned,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.recordId), record);
    this.indexRecord(workspaceId, record);
    return structuredClone(record);
  }

  async getById(
    workspaceId: string,
    recordId: string,
  ): Promise<CompanyManufacturingRecord | null> {
    const record = this.store.get(recordKey(workspaceId, recordId));
    return record ? structuredClone(record) : null;
  }

  async getLatest(workspaceId: string): Promise<CompanyManufacturingRecord | null> {
    const recordId = this.latestIndex.get(workspaceId);
    if (!recordId) return null;
    return this.getById(workspaceId, recordId);
  }

  async getByProduct(
    workspaceId: string,
    productId: string,
  ): Promise<CompanyManufacturingRecord | null> {
    const recordId = this.productIndex.get(`${workspaceId}:${productId}`);
    if (!recordId) return null;
    return this.getById(workspaceId, recordId);
  }

  async list(query: CompanyManufacturingRepositoryQuery): Promise<CompanyManufacturingRecord[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    if (query.productId) {
      results = results.filter((record) => record.productId === query.productId);
    }
    if (query.brandId) {
      results = results.filter((record) => record.brandId === query.brandId);
    }
    if (query.minConfidence !== undefined) {
      results = results.filter((record) => record.confidence >= query.minConfidence!);
    }

    results.sort(
      (left, right) =>
        right.updatedAt.localeCompare(left.updatedAt) ||
        right.confidence - left.confidence,
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, recordId: string): Promise<boolean> {
    const key = recordKey(workspaceId, recordId);
    const existing = this.store.get(key);
    if (!existing) return false;

    if (this.latestIndex.get(workspaceId) === recordId) {
      this.latestIndex.delete(workspaceId);
    }
    this.productIndex.delete(`${workspaceId}:${existing.productId}`);

    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory company manufacturing repository. */
export function createInMemoryCompanyManufacturingRepository(): InMemoryCompanyManufacturingRepository {
  return new InMemoryCompanyManufacturingRepository();
}
