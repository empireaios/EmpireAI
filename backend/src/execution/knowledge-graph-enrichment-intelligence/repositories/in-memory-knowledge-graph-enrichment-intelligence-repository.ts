import { randomUUID } from "node:crypto";

import type {
  KnowledgeGraphEnrichmentRecord,
  KnowledgeGraphEnrichmentRecordCreateInput,
} from "../models/knowledge-graph-enrichment-record.js";
import type {
  KnowledgeGraphEnrichmentIntelligenceRepository,
  KnowledgeGraphEnrichmentIntelligenceRepositoryQuery,
} from "./knowledge-graph-enrichment-intelligence-repository.js";

function recordKey(workspaceId: string, recordId: string): string {
  return `${workspaceId}:knowledge-graph-enrichment-intelligence:${recordId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory KnowledgeGraphEnrichmentIntelligenceRepository for Mission 098 tests and local development. */
export class InMemoryKnowledgeGraphEnrichmentIntelligenceRepository
  implements KnowledgeGraphEnrichmentIntelligenceRepository
{
  private readonly store = new Map<string, KnowledgeGraphEnrichmentRecord>();
  private readonly storeIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: KnowledgeGraphEnrichmentRecordCreateInput,
  ): Promise<KnowledgeGraphEnrichmentRecord> {
    const storeKey = `${workspaceId}:${input.storeId}`;
    const existingId = this.storeIndex.get(storeKey);
    const timestamp = nowIso();
    const cloned = structuredClone(input);

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: KnowledgeGraphEnrichmentRecord = {
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
    const record: KnowledgeGraphEnrichmentRecord = {
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

  async getById(
    workspaceId: string,
    recordId: string,
  ): Promise<KnowledgeGraphEnrichmentRecord | null> {
    const record = this.store.get(recordKey(workspaceId, recordId));
    return record ? structuredClone(record) : null;
  }

  async getByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<KnowledgeGraphEnrichmentRecord | null> {
    const recordId = this.storeIndex.get(`${workspaceId}:${storeId}`);
    if (!recordId) return null;
    return this.getById(workspaceId, recordId);
  }

  async list(
    query: KnowledgeGraphEnrichmentIntelligenceRepositoryQuery,
  ): Promise<KnowledgeGraphEnrichmentRecord[]> {
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

/** Factory for a fresh in-memory knowledge graph enrichment intelligence repository. */
export function createInMemoryKnowledgeGraphEnrichmentIntelligenceRepository(): InMemoryKnowledgeGraphEnrichmentIntelligenceRepository {
  return new InMemoryKnowledgeGraphEnrichmentIntelligenceRepository();
}
