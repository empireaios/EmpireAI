import { randomUUID } from "node:crypto";

import type {
  InvestigationLearningRecord,
  InvestigationLearningRecordCreateInput,
} from "../models/investigation-learning-record.js";
import type {
  LearningRepository,
  LearningRepositoryQuery,
} from "./learning-repository.js";

function recordKey(workspaceId: string, recordId: string): string {
  return `${workspaceId}:learning:${recordId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory LearningRepository for Mission 042 tests and local development. */
export class InMemoryLearningRepository implements LearningRepository {
  private readonly store = new Map<string, InvestigationLearningRecord>();
  private readonly executionIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: InvestigationLearningRecordCreateInput,
  ): Promise<InvestigationLearningRecord> {
    const executionKey = `${workspaceId}:${input.executionId}`;
    const existingId = this.executionIndex.get(executionKey);
    const timestamp = nowIso();

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: InvestigationLearningRecord = {
          ...existing,
          executionStatus: input.executionStatus,
          learnedPatterns: input.learnedPatterns.map((pattern) => ({ ...pattern })),
          repeatedFailures: input.repeatedFailures.map((pattern) => ({ ...pattern })),
          repeatedSuccesses: input.repeatedSuccesses.map((pattern) => ({ ...pattern })),
          confidenceAdjustment: { ...input.confidenceAdjustment },
          investigationRecommendations: input.investigationRecommendations.map(
            (recommendation) => ({ ...recommendation }),
          ),
          signals: input.signals.map((signal) => ({ ...signal })),
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        return structuredClone(updated);
      }
    }

    const record: InvestigationLearningRecord = {
      id: randomUUID(),
      workspaceId,
      executionId: input.executionId,
      investigationPlanId: input.investigationPlanId,
      targetId: input.targetId,
      productId: input.productId,
      executionStatus: input.executionStatus,
      learnedPatterns: input.learnedPatterns.map((pattern) => ({ ...pattern })),
      repeatedFailures: input.repeatedFailures.map((pattern) => ({ ...pattern })),
      repeatedSuccesses: input.repeatedSuccesses.map((pattern) => ({ ...pattern })),
      confidenceAdjustment: { ...input.confidenceAdjustment },
      investigationRecommendations: input.investigationRecommendations.map(
        (recommendation) => ({ ...recommendation }),
      ),
      signals: input.signals.map((signal) => ({ ...signal })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.id), record);
    this.executionIndex.set(executionKey, record.id);
    return structuredClone(record);
  }

  async getById(
    workspaceId: string,
    recordId: string,
  ): Promise<InvestigationLearningRecord | null> {
    const record = this.store.get(recordKey(workspaceId, recordId));
    return record ? structuredClone(record) : null;
  }

  async getByExecution(
    workspaceId: string,
    executionId: string,
  ): Promise<InvestigationLearningRecord | null> {
    const recordId = this.executionIndex.get(`${workspaceId}:${executionId}`);
    if (!recordId) {
      return null;
    }
    return this.getById(workspaceId, recordId);
  }

  async list(query: LearningRepositoryQuery): Promise<InvestigationLearningRecord[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    if (query.productId) {
      results = results.filter((record) => record.productId === query.productId);
    }
    if (query.executionId) {
      results = results.filter((record) => record.executionId === query.executionId);
    }
    if (query.executionStatus) {
      results = results.filter((record) => record.executionStatus === query.executionStatus);
    }

    results.sort(
      (left, right) =>
        right.updatedAt.localeCompare(left.updatedAt) ||
        left.productId.localeCompare(right.productId),
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, recordId: string): Promise<boolean> {
    const key = recordKey(workspaceId, recordId);
    const existing = this.store.get(key);
    if (!existing) {
      return false;
    }
    this.executionIndex.delete(`${workspaceId}:${existing.executionId}`);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory learning repository. */
export function createInMemoryLearningRepository(): InMemoryLearningRepository {
  return new InMemoryLearningRepository();
}
