import { randomUUID } from "node:crypto";

import type {
  GeneratedStorefront,
  GeneratedStorefrontCreateInput,
} from "../models/generated-storefront.js";
import type {
  CodeGenerationRepository,
  CodeGenerationRepositoryQuery,
} from "./code-generation-repository.js";

function recordKey(workspaceId: string, generatedStorefrontId: string): string {
  return `${workspaceId}:generated-storefront:${generatedStorefrontId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

function cloneInput(input: GeneratedStorefrontCreateInput): GeneratedStorefrontCreateInput {
  return {
    ...input,
    generatedPages: input.generatedPages.map((page) => ({
      ...page,
      componentImports: [...page.componentImports],
    })),
    generatedComponents: input.generatedComponents.map((component) => ({
      ...component,
      imports: [...component.imports],
      exports: [...component.exports],
    })),
    projectStructure: {
      ...input.projectStructure,
      directories: [...input.projectStructure.directories],
      files: [...input.projectStructure.files],
    },
    deploymentMetadata: {
      ...input.deploymentMetadata,
      envVars: { ...input.deploymentMetadata.envVars },
    },
    signals: input.signals.map((signal) => ({ ...signal })),
  };
}

/** In-memory CodeGenerationRepository for Mission 054 tests and local development. */
export class InMemoryCodeGenerationRepository implements CodeGenerationRepository {
  private readonly store = new Map<string, GeneratedStorefront>();
  private readonly storefrontIndex = new Map<string, string>();
  private readonly storeIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: GeneratedStorefrontCreateInput,
  ): Promise<GeneratedStorefront> {
    const storefrontKey = `${workspaceId}:${input.storefrontId}`;
    const storeKey = `${workspaceId}:${input.storeId}`;
    const existingId = this.storefrontIndex.get(storefrontKey);
    const timestamp = nowIso();
    const cloned = cloneInput(input);

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: GeneratedStorefront = {
          ...existing,
          ...cloned,
          generatedStorefrontId: existing.generatedStorefrontId,
          workspaceId: existing.workspaceId,
          createdAt: existing.createdAt,
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        this.storeIndex.set(storeKey, existing.generatedStorefrontId);
        return structuredClone(updated);
      }
    }

    const record: GeneratedStorefront = {
      generatedStorefrontId: randomUUID(),
      workspaceId,
      ...cloned,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.generatedStorefrontId), record);
    this.storefrontIndex.set(storefrontKey, record.generatedStorefrontId);
    this.storeIndex.set(storeKey, record.generatedStorefrontId);
    return structuredClone(record);
  }

  async getById(
    workspaceId: string,
    generatedStorefrontId: string,
  ): Promise<GeneratedStorefront | null> {
    const record = this.store.get(recordKey(workspaceId, generatedStorefrontId));
    return record ? structuredClone(record) : null;
  }

  async getByStorefront(
    workspaceId: string,
    storefrontId: string,
  ): Promise<GeneratedStorefront | null> {
    const generatedStorefrontId = this.storefrontIndex.get(`${workspaceId}:${storefrontId}`);
    if (!generatedStorefrontId) {
      return null;
    }
    return this.getById(workspaceId, generatedStorefrontId);
  }

  async getByStore(workspaceId: string, storeId: string): Promise<GeneratedStorefront | null> {
    const generatedStorefrontId = this.storeIndex.get(`${workspaceId}:${storeId}`);
    if (!generatedStorefrontId) {
      return null;
    }
    return this.getById(workspaceId, generatedStorefrontId);
  }

  async list(query: CodeGenerationRepositoryQuery): Promise<GeneratedStorefront[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    if (query.storefrontId) {
      results = results.filter((record) => record.storefrontId === query.storefrontId);
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
        right.confidence - left.confidence || left.storefrontId.localeCompare(right.storefrontId),
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, generatedStorefrontId: string): Promise<boolean> {
    const key = recordKey(workspaceId, generatedStorefrontId);
    const existing = this.store.get(key);
    if (!existing) {
      return false;
    }
    this.storefrontIndex.delete(`${workspaceId}:${existing.storefrontId}`);
    this.storeIndex.delete(`${workspaceId}:${existing.storeId}`);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory code generation repository. */
export function createInMemoryCodeGenerationRepository(): InMemoryCodeGenerationRepository {
  return new InMemoryCodeGenerationRepository();
}
