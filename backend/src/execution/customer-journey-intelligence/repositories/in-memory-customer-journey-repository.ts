import { randomUUID } from "node:crypto";

import type {
  CustomerJourneyRecord,
  CustomerJourneyRecordCreateInput,
} from "../models/customer-journey-record.js";
import type {
  CustomerJourneyRepository,
  CustomerJourneyRepositoryQuery,
} from "./customer-journey-repository.js";

function recordKey(workspaceId: string, recordId: string): string {
  return `${workspaceId}:customer-journey:${recordId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory CustomerJourneyRepository for Mission 082 tests and local development. */
export class InMemoryCustomerJourneyRepository implements CustomerJourneyRepository {
  private readonly store = new Map<string, CustomerJourneyRecord>();
  private readonly storeIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: CustomerJourneyRecordCreateInput,
  ): Promise<CustomerJourneyRecord> {
    const storeKey = `${workspaceId}:${input.storeId}`;
    const existingId = this.storeIndex.get(storeKey);
    const timestamp = nowIso();
    const cloned = structuredClone(input);

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: CustomerJourneyRecord = {
          ...existing,
          ...cloned,
          recordId: existing.recordId,
          journeyId: existing.journeyId,
          workspaceId: existing.workspaceId,
          createdAt: existing.createdAt,
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        return structuredClone(updated);
      }
    }

    const journeyId = randomUUID();
    const record: CustomerJourneyRecord = {
      recordId: randomUUID(),
      journeyId,
      workspaceId,
      ...cloned,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.recordId), record);
    this.storeIndex.set(storeKey, record.recordId);
    return structuredClone(record);
  }

  async getById(workspaceId: string, recordId: string): Promise<CustomerJourneyRecord | null> {
    const record = this.store.get(recordKey(workspaceId, recordId));
    return record ? structuredClone(record) : null;
  }

  async getByStore(workspaceId: string, storeId: string): Promise<CustomerJourneyRecord | null> {
    const recordId = this.storeIndex.get(`${workspaceId}:${storeId}`);
    if (!recordId) return null;
    return this.getById(workspaceId, recordId);
  }

  async list(query: CustomerJourneyRepositoryQuery): Promise<CustomerJourneyRecord[]> {
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

/** Factory for a fresh in-memory customer journey repository. */
export function createInMemoryCustomerJourneyRepository(): InMemoryCustomerJourneyRepository {
  return new InMemoryCustomerJourneyRepository();
}
