import { randomUUID } from "node:crypto";

import type {
  FounderCommandCenterRecord,
  FounderCommandCenterRecordCreateInput,
} from "../models/founder-command-center-record.js";
import type {
  FounderCommandCenterRepository,
  FounderCommandCenterRepositoryQuery,
} from "./founder-command-center-repository.js";

function recordKey(workspaceId: string, recordId: string): string {
  return `${workspaceId}:founder-command:${recordId}`;
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
  input: FounderCommandCenterRecordCreateInput,
): FounderCommandCenterRecordCreateInput {
  return {
    ...input,
    opportunities: {
      ...input.opportunities,
      items: input.opportunities.items.map((item) => ({ ...item })),
    },
    brands: {
      ...input.brands,
      items: input.brands.items.map((item) => ({ ...item })),
    },
    stores: {
      ...input.stores,
      items: input.stores.items.map((item) => ({ ...item })),
    },
    suppliers: {
      ...input.suppliers,
      items: input.suppliers.items.map((item) => ({ ...item })),
    },
    campaigns: {
      ...input.campaigns,
      items: input.campaigns.items.map((item) => ({ ...item })),
    },
    capitalAllocation: {
      ...input.capitalAllocation,
      items: input.capitalAllocation.items.map((item) => ({ ...item })),
    },
    revenueTracking: { ...input.revenueTracking },
    deploymentStatus: {
      ...input.deploymentStatus,
      items: input.deploymentStatus.items.map((item) => ({ ...item })),
    },
    signals: input.signals.map((signal) => ({ ...signal })),
  };
}

/** In-memory FounderCommandCenterRepository for Mission 071 tests and local development. */
export class InMemoryFounderCommandCenterRepository implements FounderCommandCenterRepository {
  private readonly store = new Map<string, FounderCommandCenterRecord>();
  private readonly latestIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: FounderCommandCenterRecordCreateInput,
  ): Promise<FounderCommandCenterRecord> {
    const timestamp = nowIso();
    const cloned = cloneInput(input);
    const dashboardId = randomUUID();
    const record: FounderCommandCenterRecord = {
      recordId: randomUUID(),
      dashboardId,
      workspaceId,
      ...cloned,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.recordId), record);
    this.latestIndex.set(workspaceId, record.recordId);
    return structuredClone(record);
  }

  async getById(
    workspaceId: string,
    recordId: string,
  ): Promise<FounderCommandCenterRecord | null> {
    const record = this.store.get(recordKey(workspaceId, recordId));
    return record ? structuredClone(record) : null;
  }

  async getLatest(workspaceId: string): Promise<FounderCommandCenterRecord | null> {
    const recordId = this.latestIndex.get(workspaceId);
    if (!recordId) return null;
    return this.getById(workspaceId, recordId);
  }

  async list(query: FounderCommandCenterRepositoryQuery): Promise<FounderCommandCenterRecord[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

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

    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory founder command center repository. */
export function createInMemoryFounderCommandCenterRepository(): InMemoryFounderCommandCenterRepository {
  return new InMemoryFounderCommandCenterRepository();
}
