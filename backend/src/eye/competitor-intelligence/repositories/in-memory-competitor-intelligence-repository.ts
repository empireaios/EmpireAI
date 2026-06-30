import { randomUUID } from "node:crypto";

import type {
  CompetitorIntelligenceRecord,
  CompetitorIntelligenceRecordCreateInput,
} from "../models/competitor-intelligence-record.js";
import type { CompetitorSnapshot } from "../models/competitor-snapshot.js";
import type {
  CompetitorIntelligenceRepository,
  CompetitorIntelligenceRepositoryQuery,
} from "./competitor-intelligence-repository.js";

function recordKey(workspaceId: string, recordId: string): string {
  return `${workspaceId}:competitor-intelligence:${recordId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory CompetitorIntelligenceRepository for Mission 087 tests and local development. */
export class InMemoryCompetitorIntelligenceRepository implements CompetitorIntelligenceRepository {
  private readonly store = new Map<string, CompetitorIntelligenceRecord>();
  private readonly storeIndex = new Map<string, string>();
  private readonly snapshotIndex = new Map<string, CompetitorSnapshot[]>();

  async save(
    workspaceId: string,
    input: CompetitorIntelligenceRecordCreateInput,
  ): Promise<CompetitorIntelligenceRecord> {
    const storeKey = `${workspaceId}:${input.storeId}`;
    const existingId = this.storeIndex.get(storeKey);
    const timestamp = nowIso();
    const cloned = structuredClone(input);

    this.snapshotIndex.set(storeKey, structuredClone(cloned.snapshots));

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: CompetitorIntelligenceRecord = {
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
    const record: CompetitorIntelligenceRecord = {
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
  ): Promise<CompetitorIntelligenceRecord | null> {
    const record = this.store.get(recordKey(workspaceId, recordId));
    return record ? structuredClone(record) : null;
  }

  async getByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<CompetitorIntelligenceRecord | null> {
    const recordId = this.storeIndex.get(`${workspaceId}:${storeId}`);
    if (!recordId) return null;
    return this.getById(workspaceId, recordId);
  }

  async getLatestSnapshots(workspaceId: string, storeId: string): Promise<CompetitorSnapshot[]> {
    const snapshots = this.snapshotIndex.get(`${workspaceId}:${storeId}`);
    return snapshots ? structuredClone(snapshots) : [];
  }

  async list(query: CompetitorIntelligenceRepositoryQuery): Promise<CompetitorIntelligenceRecord[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

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
    this.snapshotIndex.delete(`${workspaceId}:${existing.storeId}`);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory competitor intelligence repository. */
export function createInMemoryCompetitorIntelligenceRepository(): InMemoryCompetitorIntelligenceRepository {
  return new InMemoryCompetitorIntelligenceRepository();
}
