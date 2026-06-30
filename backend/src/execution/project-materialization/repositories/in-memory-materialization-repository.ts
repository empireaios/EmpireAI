import { randomUUID } from "node:crypto";

import type {
  MaterializedProject,
  MaterializedProjectCreateInput,
} from "../models/materialized-project.js";
import type {
  MaterializationRepository,
  MaterializationRepositoryQuery,
} from "./materialization-repository.js";

function recordKey(workspaceId: string, projectId: string): string {
  return `${workspaceId}:materialized-project:${projectId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

function cloneInput(input: MaterializedProjectCreateInput): MaterializedProjectCreateInput {
  return {
    ...input,
    projectStructure: {
      ...input.projectStructure,
      directories: [...input.projectStructure.directories],
      files: [...input.projectStructure.files],
    },
    materializedFiles: input.materializedFiles.map((file) => ({ ...file })),
    dependencyMap: Object.fromEntries(
      Object.entries(input.dependencyMap).map(([path, deps]) => [path, [...deps]]),
    ),
    buildMetadata: {
      ...input.buildMetadata,
      envVars: { ...input.buildMetadata.envVars },
    },
    signals: input.signals.map((signal) => ({ ...signal })),
  };
}

/** In-memory MaterializationRepository for Mission 056 tests and local development. */
export class InMemoryMaterializationRepository implements MaterializationRepository {
  private readonly store = new Map<string, MaterializedProject>();
  private readonly storefrontIndex = new Map<string, string>();
  private readonly storeIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: MaterializedProjectCreateInput,
  ): Promise<MaterializedProject> {
    const storefrontKey = `${workspaceId}:${input.generatedStorefrontId}`;
    const storeKey = `${workspaceId}:${input.storeId}`;
    const existingId = this.storefrontIndex.get(storefrontKey);
    const timestamp = nowIso();
    const cloned = cloneInput(input);

    const materializedFiles = cloned.materializedFiles.map((file) => ({
      ...file,
      fileId: randomUUID(),
    }));

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: MaterializedProject = {
          ...existing,
          ...cloned,
          materializedFiles,
          projectId: existing.projectId,
          workspaceId: existing.workspaceId,
          createdAt: existing.createdAt,
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        this.storeIndex.set(storeKey, existing.projectId);
        return structuredClone(updated);
      }
    }

    const record: MaterializedProject = {
      projectId: randomUUID(),
      workspaceId,
      ...cloned,
      materializedFiles,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.projectId), record);
    this.storefrontIndex.set(storefrontKey, record.projectId);
    this.storeIndex.set(storeKey, record.projectId);
    return structuredClone(record);
  }

  async getById(workspaceId: string, projectId: string): Promise<MaterializedProject | null> {
    const record = this.store.get(recordKey(workspaceId, projectId));
    return record ? structuredClone(record) : null;
  }

  async getByStorefront(
    workspaceId: string,
    generatedStorefrontId: string,
  ): Promise<MaterializedProject | null> {
    const projectId = this.storefrontIndex.get(`${workspaceId}:${generatedStorefrontId}`);
    if (!projectId) {
      return null;
    }
    return this.getById(workspaceId, projectId);
  }

  async getByStore(workspaceId: string, storeId: string): Promise<MaterializedProject | null> {
    const projectId = this.storeIndex.get(`${workspaceId}:${storeId}`);
    if (!projectId) {
      return null;
    }
    return this.getById(workspaceId, projectId);
  }

  async list(query: MaterializationRepositoryQuery): Promise<MaterializedProject[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    if (query.generatedStorefrontId) {
      results = results.filter(
        (record) => record.generatedStorefrontId === query.generatedStorefrontId,
      );
    }
    if (query.storeId) {
      results = results.filter((record) => record.storeId === query.storeId);
    }
    if (query.brandId) {
      results = results.filter((record) => record.brandId === query.brandId);
    }
    if (query.minConfidence !== undefined) {
      results = results.filter((record) => record.confidence >= query.minConfidence!);
    }

    results.sort(
      (left, right) =>
        right.confidence - left.confidence ||
        left.generatedStorefrontId.localeCompare(right.generatedStorefrontId),
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, projectId: string): Promise<boolean> {
    const key = recordKey(workspaceId, projectId);
    const existing = this.store.get(key);
    if (!existing) {
      return false;
    }
    this.storefrontIndex.delete(`${workspaceId}:${existing.generatedStorefrontId}`);
    this.storeIndex.delete(`${workspaceId}:${existing.storeId}`);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory materialization repository. */
export function createInMemoryMaterializationRepository(): InMemoryMaterializationRepository {
  return new InMemoryMaterializationRepository();
}
