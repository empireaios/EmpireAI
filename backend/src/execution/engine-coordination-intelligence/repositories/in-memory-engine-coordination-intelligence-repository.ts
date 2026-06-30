import { randomUUID } from "node:crypto";

import type {
  EngineCoordinationRecord,
  EngineCoordinationRecordCreateInput,
} from "../models/engine-coordination-record.js";
import type {
  EngineCoordinationIntelligenceRepository,
  EngineCoordinationIntelligenceRepositoryQuery,
} from "./engine-coordination-intelligence-repository.js";

function recordKey(workspaceId: string, recordId: string): string {
  return `${workspaceId}:engine-coordination-intelligence:${recordId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory EngineCoordinationIntelligenceRepository for Mission 099 tests and local development. */
export class InMemoryEngineCoordinationIntelligenceRepository
  implements EngineCoordinationIntelligenceRepository
{
  private readonly store = new Map<string, EngineCoordinationRecord>();
  private readonly workspaceIndex = new Map<string, string>();

  async save(input: EngineCoordinationRecordCreateInput): Promise<EngineCoordinationRecord> {
    const workspaceKey = input.workspaceId;
    const existingId = this.workspaceIndex.get(workspaceKey);
    const timestamp = nowIso();
    const cloned = structuredClone(input);

    if (existingId) {
      const key = recordKey(input.workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: EngineCoordinationRecord = {
          ...existing,
          ...cloned,
          recordId: existing.recordId,
          reportId: existing.reportId,
          createdAt: existing.createdAt,
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        return structuredClone(updated);
      }
    }

    const reportId = randomUUID();
    const record: EngineCoordinationRecord = {
      recordId: randomUUID(),
      reportId,
      ...cloned,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(input.workspaceId, record.recordId), record);
    this.workspaceIndex.set(workspaceKey, record.recordId);
    return structuredClone(record);
  }

  async getById(workspaceId: string, recordId: string): Promise<EngineCoordinationRecord | null> {
    const record = this.store.get(recordKey(workspaceId, recordId));
    return record ? structuredClone(record) : null;
  }

  async getByWorkspace(workspaceId: string): Promise<EngineCoordinationRecord | null> {
    const recordId = this.workspaceIndex.get(workspaceId);
    if (!recordId) return null;
    return this.getById(workspaceId, recordId);
  }

  async list(query: EngineCoordinationIntelligenceRepositoryQuery): Promise<EngineCoordinationRecord[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    results.sort(
      (left, right) =>
        right.updatedAt.localeCompare(left.updatedAt) ||
        left.workspaceId.localeCompare(right.workspaceId),
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, recordId: string): Promise<boolean> {
    const key = recordKey(workspaceId, recordId);
    const existing = this.store.get(key);
    if (!existing) return false;
    this.workspaceIndex.delete(existing.workspaceId);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory engine coordination intelligence repository. */
export function createInMemoryEngineCoordinationIntelligenceRepository(): InMemoryEngineCoordinationIntelligenceRepository {
  return new InMemoryEngineCoordinationIntelligenceRepository();
}
