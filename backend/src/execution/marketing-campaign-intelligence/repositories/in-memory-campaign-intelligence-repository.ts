import { randomUUID } from "node:crypto";

import type {
  CampaignIntelligenceRecord,
  CampaignIntelligenceRecordCreateInput,
} from "../models/campaign-intelligence-record.js";
import type {
  CampaignIntelligenceRepository,
  CampaignIntelligenceRepositoryQuery,
} from "./campaign-intelligence-repository.js";

function recordKey(workspaceId: string, recordId: string): string {
  return `${workspaceId}:campaign-intelligence:${recordId}`;
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
  input: CampaignIntelligenceRecordCreateInput,
): CampaignIntelligenceRecordCreateInput {
  return structuredClone(input);
}

/** In-memory CampaignIntelligenceRepository for Mission 077 tests and local development. */
export class InMemoryCampaignIntelligenceRepository implements CampaignIntelligenceRepository {
  private readonly store = new Map<string, CampaignIntelligenceRecord>();
  private readonly brandIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: CampaignIntelligenceRecordCreateInput,
  ): Promise<CampaignIntelligenceRecord> {
    const brandKey = `${workspaceId}:${input.brandId}`;
    const existingId = this.brandIndex.get(brandKey);
    const timestamp = nowIso();
    const cloned = cloneInput(input);

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: CampaignIntelligenceRecord = {
          ...existing,
          ...cloned,
          recordId: existing.recordId,
          intelligenceId: existing.intelligenceId,
          workspaceId: existing.workspaceId,
          createdAt: existing.createdAt,
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        return structuredClone(updated);
      }
    }

    const intelligenceId = randomUUID();
    const record: CampaignIntelligenceRecord = {
      recordId: randomUUID(),
      intelligenceId,
      workspaceId,
      ...cloned,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.recordId), record);
    this.brandIndex.set(brandKey, record.recordId);
    return structuredClone(record);
  }

  async getById(
    workspaceId: string,
    recordId: string,
  ): Promise<CampaignIntelligenceRecord | null> {
    const record = this.store.get(recordKey(workspaceId, recordId));
    return record ? structuredClone(record) : null;
  }

  async getByBrand(
    workspaceId: string,
    brandId: string,
  ): Promise<CampaignIntelligenceRecord | null> {
    const recordId = this.brandIndex.get(`${workspaceId}:${brandId}`);
    if (!recordId) return null;
    return this.getById(workspaceId, recordId);
  }

  async list(query: CampaignIntelligenceRepositoryQuery): Promise<CampaignIntelligenceRecord[]> {
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

/** Factory for a fresh in-memory campaign intelligence repository. */
export function createInMemoryCampaignIntelligenceRepository(): InMemoryCampaignIntelligenceRepository {
  return new InMemoryCampaignIntelligenceRepository();
}
