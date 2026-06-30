import { randomUUID } from "node:crypto";

import type {
  DecisionExplainabilityRecord,
  DecisionExplainabilityRecordCreateInput,
} from "../models/decision-explainability-record.js";
import type {
  DecisionExplainabilityIntelligenceRepository,
  DecisionExplainabilityIntelligenceRepositoryQuery,
} from "./decision-explainability-intelligence-repository.js";

function recordKey(workspaceId: string, recordId: string): string {
  return `${workspaceId}:decision-explainability-intelligence:${recordId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory DecisionExplainabilityIntelligenceRepository for Mission 092 tests and local development. */
export class InMemoryDecisionExplainabilityIntelligenceRepository
  implements DecisionExplainabilityIntelligenceRepository
{
  private readonly store = new Map<string, DecisionExplainabilityRecord>();
  private readonly storeIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: DecisionExplainabilityRecordCreateInput,
  ): Promise<DecisionExplainabilityRecord> {
    const storeKey = `${workspaceId}:${input.storeId}:${input.decisionType}`;
    const existingId = this.storeIndex.get(storeKey);
    const timestamp = nowIso();
    const cloned = structuredClone(input);

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: DecisionExplainabilityRecord = {
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
    const record: DecisionExplainabilityRecord = {
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
  ): Promise<DecisionExplainabilityRecord | null> {
    const record = this.store.get(recordKey(workspaceId, recordId));
    return record ? structuredClone(record) : null;
  }

  async getByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<DecisionExplainabilityRecord | null> {
    for (const record of this.store.values()) {
      if (record.workspaceId === workspaceId && record.storeId === storeId) {
        return structuredClone(record);
      }
    }
    return null;
  }

  async list(
    query: DecisionExplainabilityIntelligenceRepositoryQuery,
  ): Promise<DecisionExplainabilityRecord[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    if (query.brandId) {
      results = results.filter((record) => record.brandId === query.brandId);
    }
    if (query.storeId) {
      results = results.filter((record) => record.storeId === query.storeId);
    }
    if (query.decisionType) {
      results = results.filter((record) => record.decisionType === query.decisionType);
    }

    results.sort(
      (left, right) =>
        right.updatedAt.localeCompare(left.updatedAt) ||
        left.decisionType.localeCompare(right.decisionType),
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, recordId: string): Promise<boolean> {
    const key = recordKey(workspaceId, recordId);
    const existing = this.store.get(key);
    if (!existing) return false;
    this.storeIndex.delete(`${workspaceId}:${existing.storeId}:${existing.decisionType}`);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory decision explainability intelligence repository. */
export function createInMemoryDecisionExplainabilityIntelligenceRepository(): InMemoryDecisionExplainabilityIntelligenceRepository {
  return new InMemoryDecisionExplainabilityIntelligenceRepository();
}
