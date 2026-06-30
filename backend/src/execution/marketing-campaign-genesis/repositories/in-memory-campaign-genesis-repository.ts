import { randomUUID } from "node:crypto";

import type {
  CampaignGenesisRecord,
  CampaignGenesisRecordCreateInput,
} from "../models/campaign-genesis-record.js";
import type {
  CampaignGenesisRepository,
  CampaignGenesisRepositoryQuery,
} from "./campaign-genesis-repository.js";

function recordKey(workspaceId: string, recordId: string): string {
  return `${workspaceId}:campaign-genesis:${recordId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

function cloneInput(input: CampaignGenesisRecordCreateInput): CampaignGenesisRecordCreateInput {
  return {
    ...input,
    adAngles: input.adAngles.map((angle) => ({ ...angle })),
    creativeIdeas: input.creativeIdeas.map((idea) => ({ ...idea })),
    platformRecommendations: input.platformRecommendations.map((entry) => ({ ...entry })),
    signals: input.signals.map((signal) => ({ ...signal })),
  };
}

/** In-memory CampaignGenesisRepository for Mission 069 tests and local development. */
export class InMemoryCampaignGenesisRepository implements CampaignGenesisRepository {
  private readonly store = new Map<string, CampaignGenesisRecord>();
  private readonly brandIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: CampaignGenesisRecordCreateInput,
  ): Promise<CampaignGenesisRecord> {
    const brandKey = `${workspaceId}:${input.brandId}`;
    const existingId = this.brandIndex.get(brandKey);
    const timestamp = nowIso();
    const cloned = cloneInput(input);

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: CampaignGenesisRecord = {
          ...existing,
          ...cloned,
          recordId: existing.recordId,
          campaignId: existing.campaignId,
          workspaceId: existing.workspaceId,
          createdAt: existing.createdAt,
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        return structuredClone(updated);
      }
    }

    const campaignId = randomUUID();
    const record: CampaignGenesisRecord = {
      recordId: randomUUID(),
      campaignId,
      workspaceId,
      ...cloned,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.recordId), record);
    this.brandIndex.set(brandKey, record.recordId);
    return structuredClone(record);
  }

  async getById(workspaceId: string, recordId: string): Promise<CampaignGenesisRecord | null> {
    const record = this.store.get(recordKey(workspaceId, recordId));
    return record ? structuredClone(record) : null;
  }

  async getByBrand(workspaceId: string, brandId: string): Promise<CampaignGenesisRecord | null> {
    const recordId = this.brandIndex.get(`${workspaceId}:${brandId}`);
    if (!recordId) return null;
    return this.getById(workspaceId, recordId);
  }

  async list(query: CampaignGenesisRepositoryQuery): Promise<CampaignGenesisRecord[]> {
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

/** Factory for a fresh in-memory campaign genesis repository. */
export function createInMemoryCampaignGenesisRepository(): InMemoryCampaignGenesisRepository {
  return new InMemoryCampaignGenesisRepository();
}
