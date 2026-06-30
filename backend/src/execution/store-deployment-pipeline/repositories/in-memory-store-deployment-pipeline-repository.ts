import { randomUUID } from "node:crypto";

import type {
  StoreDeploymentRecord,
  StoreDeploymentRecordCreateInput,
} from "../models/store-deployment-record.js";
import type {
  StoreDeploymentPipelineRepository,
  StoreDeploymentPipelineRepositoryQuery,
} from "./store-deployment-pipeline-repository.js";

function recordKey(workspaceId: string, recordId: string): string {
  return `${workspaceId}:store-deployment:${recordId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

function cloneInput(input: StoreDeploymentRecordCreateInput): StoreDeploymentRecordCreateInput {
  return {
    ...input,
    deploymentPackage: { ...input.deploymentPackage },
    deploymentArtifacts: input.deploymentArtifacts.map((artifact) => ({ ...artifact })),
    deploymentMetadata: { ...input.deploymentMetadata },
    signals: input.signals.map((signal) => ({ ...signal })),
  };
}

/** In-memory StoreDeploymentPipelineRepository for Mission 065 tests and local development. */
export class InMemoryStoreDeploymentPipelineRepository implements StoreDeploymentPipelineRepository {
  private readonly store = new Map<string, StoreDeploymentRecord>();
  private readonly projectIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: StoreDeploymentRecordCreateInput,
  ): Promise<StoreDeploymentRecord> {
    const projectKey = `${workspaceId}:${input.deploymentMetadata.projectId}`;
    const existingId = this.projectIndex.get(projectKey);
    const timestamp = nowIso();
    const cloned = cloneInput(input);

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: StoreDeploymentRecord = {
          ...existing,
          ...cloned,
          recordId: existing.recordId,
          workspaceId: existing.workspaceId,
          createdAt: existing.createdAt,
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        return structuredClone(updated);
      }
    }

    const record: StoreDeploymentRecord = {
      recordId: randomUUID(),
      workspaceId,
      ...cloned,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.recordId), record);
    this.projectIndex.set(projectKey, record.recordId);
    return structuredClone(record);
  }

  async getById(workspaceId: string, recordId: string): Promise<StoreDeploymentRecord | null> {
    const record = this.store.get(recordKey(workspaceId, recordId));
    return record ? structuredClone(record) : null;
  }

  async getByProject(
    workspaceId: string,
    projectId: string,
  ): Promise<StoreDeploymentRecord | null> {
    const recordId = this.projectIndex.get(`${workspaceId}:${projectId}`);
    if (!recordId) return null;
    return this.getById(workspaceId, recordId);
  }

  async list(query: StoreDeploymentPipelineRepositoryQuery): Promise<StoreDeploymentRecord[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    if (query.projectId) {
      results = results.filter(
        (record) => record.deploymentMetadata.projectId === query.projectId,
      );
    }
    if (query.storeId) {
      results = results.filter((record) => record.deploymentMetadata.storeId === query.storeId);
    }
    if (query.generatedStorefrontId) {
      results = results.filter(
        (record) => record.deploymentMetadata.generatedStorefrontId === query.generatedStorefrontId,
      );
    }
    if (query.deploymentStatus) {
      results = results.filter((record) => record.deploymentStatus === query.deploymentStatus);
    }
    if (query.hostingTarget) {
      results = results.filter(
        (record) => record.deploymentPackage.hostingTarget === query.hostingTarget,
      );
    }

    results.sort(
      (left, right) =>
        right.updatedAt.localeCompare(left.updatedAt) ||
        left.deploymentMetadata.projectId.localeCompare(right.deploymentMetadata.projectId),
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, recordId: string): Promise<boolean> {
    const key = recordKey(workspaceId, recordId);
    const existing = this.store.get(key);
    if (!existing) return false;
    this.projectIndex.delete(`${workspaceId}:${existing.deploymentMetadata.projectId}`);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory store deployment pipeline repository. */
export function createInMemoryStoreDeploymentPipelineRepository(): InMemoryStoreDeploymentPipelineRepository {
  return new InMemoryStoreDeploymentPipelineRepository();
}
