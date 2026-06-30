import { randomUUID } from "node:crypto";

import type {
  EmpireAuditRecord,
  EmpireAuditRecordCreateInput,
} from "../models/empire-audit-record.js";
import type {
  EmpireAuditIntelligenceRepository,
  EmpireAuditIntelligenceRepositoryQuery,
} from "./empire-audit-intelligence-repository.js";

function recordKey(workspaceId: string, recordId: string): string {
  return `${workspaceId}:empire-audit-intelligence:${recordId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory EmpireAuditIntelligenceRepository for Mission 100 tests and local development. */
export class InMemoryEmpireAuditIntelligenceRepository implements EmpireAuditIntelligenceRepository {
  private readonly store = new Map<string, EmpireAuditRecord>();
  private readonly workspaceIndex = new Map<string, string>();

  async save(input: EmpireAuditRecordCreateInput): Promise<EmpireAuditRecord> {
    const workspaceKey = input.workspaceId;
    const existingId = this.workspaceIndex.get(workspaceKey);
    const timestamp = nowIso();
    const cloned = structuredClone(input);

    if (existingId) {
      const key = recordKey(input.workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: EmpireAuditRecord = {
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
    const record: EmpireAuditRecord = {
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

  async getById(workspaceId: string, recordId: string): Promise<EmpireAuditRecord | null> {
    const record = this.store.get(recordKey(workspaceId, recordId));
    return record ? structuredClone(record) : null;
  }

  async getByWorkspace(workspaceId: string): Promise<EmpireAuditRecord | null> {
    const recordId = this.workspaceIndex.get(workspaceId);
    if (!recordId) return null;
    return this.getById(workspaceId, recordId);
  }

  async list(query: EmpireAuditIntelligenceRepositoryQuery): Promise<EmpireAuditRecord[]> {
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

/** Factory for a fresh in-memory empire audit intelligence repository. */
export function createInMemoryEmpireAuditIntelligenceRepository(): InMemoryEmpireAuditIntelligenceRepository {
  return new InMemoryEmpireAuditIntelligenceRepository();
}
