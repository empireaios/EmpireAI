import { randomUUID } from "node:crypto";

import type {
  CreativeAssetRecord,
  CreativeAssetRecordCreateInput,
} from "../models/creative-asset-record.js";
import type {
  CreativeAssetBlueprintRepository,
  CreativeAssetBlueprintRepositoryQuery,
} from "./creative-asset-blueprint-repository.js";

function recordKey(workspaceId: string, recordId: string): string {
  return `${workspaceId}:creative-asset:${recordId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

function cloneInput(input: CreativeAssetRecordCreateInput): CreativeAssetRecordCreateInput {
  return {
    ...input,
    imagePrompts: input.imagePrompts.map((prompt) => ({ ...prompt })),
    videoPrompts: input.videoPrompts.map((prompt) => ({ ...prompt })),
    hooks: input.hooks.map((hook) => ({ ...hook })),
    scripts: input.scripts.map((script) => ({ ...script })),
    signals: input.signals.map((signal) => ({ ...signal })),
  };
}

/** In-memory CreativeAssetBlueprintRepository for Mission 070 tests and local development. */
export class InMemoryCreativeAssetBlueprintRepository implements CreativeAssetBlueprintRepository {
  private readonly store = new Map<string, CreativeAssetRecord>();
  private readonly campaignIndex = new Map<string, string>();
  private readonly brandIndex = new Map<string, string>();

  private indexRecord(workspaceId: string, record: CreativeAssetRecord): void {
    this.brandIndex.set(`${workspaceId}:${record.brandId}`, record.recordId);
    if (record.campaignId) {
      this.campaignIndex.set(`${workspaceId}:${record.campaignId}`, record.recordId);
    }
  }

  async save(
    workspaceId: string,
    input: CreativeAssetRecordCreateInput,
  ): Promise<CreativeAssetRecord> {
    const campaignKey = input.campaignId ? `${workspaceId}:${input.campaignId}` : null;
    const brandKey = `${workspaceId}:${input.brandId}`;
    const existingId =
      (campaignKey ? this.campaignIndex.get(campaignKey) : null) ?? this.brandIndex.get(brandKey);
    const timestamp = nowIso();
    const cloned = cloneInput(input);

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: CreativeAssetRecord = {
          ...existing,
          ...cloned,
          recordId: existing.recordId,
          blueprintId: existing.blueprintId,
          workspaceId: existing.workspaceId,
          createdAt: existing.createdAt,
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        this.indexRecord(workspaceId, updated);
        return structuredClone(updated);
      }
    }

    const blueprintId = randomUUID();
    const record: CreativeAssetRecord = {
      recordId: randomUUID(),
      blueprintId,
      workspaceId,
      ...cloned,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.recordId), record);
    this.indexRecord(workspaceId, record);
    return structuredClone(record);
  }

  async getById(workspaceId: string, recordId: string): Promise<CreativeAssetRecord | null> {
    const record = this.store.get(recordKey(workspaceId, recordId));
    return record ? structuredClone(record) : null;
  }

  async getByCampaign(
    workspaceId: string,
    campaignId: string,
  ): Promise<CreativeAssetRecord | null> {
    const recordId = this.campaignIndex.get(`${workspaceId}:${campaignId}`);
    if (!recordId) return null;
    return this.getById(workspaceId, recordId);
  }

  async getByBrand(workspaceId: string, brandId: string): Promise<CreativeAssetRecord | null> {
    const recordId = this.brandIndex.get(`${workspaceId}:${brandId}`);
    if (!recordId) return null;
    return this.getById(workspaceId, recordId);
  }

  async list(query: CreativeAssetBlueprintRepositoryQuery): Promise<CreativeAssetRecord[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    if (query.brandId) {
      results = results.filter((record) => record.brandId === query.brandId);
    }
    if (query.campaignId) {
      results = results.filter((record) => record.campaignId === query.campaignId);
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
    if (existing.campaignId) {
      this.campaignIndex.delete(`${workspaceId}:${existing.campaignId}`);
    }
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory creative asset blueprint repository. */
export function createInMemoryCreativeAssetBlueprintRepository(): InMemoryCreativeAssetBlueprintRepository {
  return new InMemoryCreativeAssetBlueprintRepository();
}
