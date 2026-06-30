import { randomUUID } from "node:crypto";

import type {
  MultiCompanyRecord,
  MultiCompanyRecordCreateInput,
} from "../models/multi-company-record.js";
import type {
  MultiCompanyIntelligenceRepository,
  MultiCompanyIntelligenceRepositoryQuery,
} from "./multi-company-intelligence-repository.js";

function recordKey(workspaceId: string, recordId: string): string {
  return `${workspaceId}:multi-company-intelligence:${recordId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory MultiCompanyIntelligenceRepository for Mission 097 tests and local development. */
export class InMemoryMultiCompanyIntelligenceRepository
  implements MultiCompanyIntelligenceRepository
{
  private readonly store = new Map<string, MultiCompanyRecord>();
  private readonly empireIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: MultiCompanyRecordCreateInput,
  ): Promise<MultiCompanyRecord> {
    const empireKey = `${workspaceId}:${input.empireId}`;
    const existingId = this.empireIndex.get(empireKey);
    const timestamp = nowIso();
    const cloned = structuredClone(input);

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: MultiCompanyRecord = {
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
    const record: MultiCompanyRecord = {
      recordId: randomUUID(),
      reportId,
      workspaceId,
      ...cloned,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.recordId), record);
    this.empireIndex.set(empireKey, record.recordId);
    return structuredClone(record);
  }

  async getById(workspaceId: string, recordId: string): Promise<MultiCompanyRecord | null> {
    const record = this.store.get(recordKey(workspaceId, recordId));
    return record ? structuredClone(record) : null;
  }

  async getByEmpire(workspaceId: string, empireId: string): Promise<MultiCompanyRecord | null> {
    const recordId = this.empireIndex.get(`${workspaceId}:${empireId}`);
    if (!recordId) return null;
    return this.getById(workspaceId, recordId);
  }

  async list(query: MultiCompanyIntelligenceRepositoryQuery): Promise<MultiCompanyRecord[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    if (query.empireId) {
      results = results.filter((record) => record.empireId === query.empireId);
    }

    results.sort(
      (left, right) =>
        right.updatedAt.localeCompare(left.updatedAt) || left.empireId.localeCompare(right.empireId),
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, recordId: string): Promise<boolean> {
    const key = recordKey(workspaceId, recordId);
    const existing = this.store.get(key);
    if (!existing) return false;
    this.empireIndex.delete(`${workspaceId}:${existing.empireId}`);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory multi-company intelligence repository. */
export function createInMemoryMultiCompanyIntelligenceRepository(): InMemoryMultiCompanyIntelligenceRepository {
  return new InMemoryMultiCompanyIntelligenceRepository();
}
