import { randomUUID } from "node:crypto";

import type {
  GeneratedArtifact,
  GeneratedArtifactCreateInput,
} from "../models/generated-artifact.js";
import type {
  ArtifactRepository,
  ArtifactRepositoryQuery,
} from "./artifact-repository.js";

function recordKey(workspaceId: string, artifactId: string): string {
  return `${workspaceId}:artifact:${artifactId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

function cloneInput(input: GeneratedArtifactCreateInput): GeneratedArtifactCreateInput {
  return {
    ...input,
    metadata: { ...input.metadata },
    signals: input.signals.map((signal) => ({ ...signal })),
  };
}

/** In-memory ArtifactRepository for Mission 055 tests and local development. */
export class InMemoryArtifactRepository implements ArtifactRepository {
  private readonly store = new Map<string, GeneratedArtifact>();
  private readonly fileIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: GeneratedArtifactCreateInput,
  ): Promise<GeneratedArtifact> {
    const fileKey = `${workspaceId}:${input.generatedStorefrontId}:${input.filePath}`;
    const existingId = this.fileIndex.get(fileKey);
    const timestamp = nowIso();
    const cloned = cloneInput(input);

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: GeneratedArtifact = {
          ...existing,
          ...cloned,
          artifactId: existing.artifactId,
          workspaceId: existing.workspaceId,
          createdAt: existing.createdAt,
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        return structuredClone(updated);
      }
    }

    const record: GeneratedArtifact = {
      artifactId: randomUUID(),
      workspaceId,
      ...cloned,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.artifactId), record);
    this.fileIndex.set(fileKey, record.artifactId);
    return structuredClone(record);
  }

  async saveMany(
    workspaceId: string,
    inputs: GeneratedArtifactCreateInput[],
  ): Promise<GeneratedArtifact[]> {
    const saved: GeneratedArtifact[] = [];
    for (const input of inputs) {
      saved.push(await this.save(workspaceId, input));
    }
    return saved;
  }

  async getById(workspaceId: string, artifactId: string): Promise<GeneratedArtifact | null> {
    const record = this.store.get(recordKey(workspaceId, artifactId));
    return record ? structuredClone(record) : null;
  }

  async getByFilePath(
    workspaceId: string,
    generatedStorefrontId: string,
    filePath: string,
  ): Promise<GeneratedArtifact | null> {
    const artifactId = this.fileIndex.get(`${workspaceId}:${generatedStorefrontId}:${filePath}`);
    if (!artifactId) {
      return null;
    }
    return this.getById(workspaceId, artifactId);
  }

  async list(query: ArtifactRepositoryQuery): Promise<GeneratedArtifact[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    if (query.generatedStorefrontId) {
      results = results.filter(
        (record) => record.generatedStorefrontId === query.generatedStorefrontId,
      );
    }
    if (query.filePath) {
      results = results.filter((record) => record.filePath === query.filePath);
    }
    if (query.fileType) {
      results = results.filter((record) => record.fileType === query.fileType);
    }
    if (query.minConfidence !== undefined) {
      results = results.filter((record) => record.confidence >= query.minConfidence!);
    }

    results.sort(
      (left, right) =>
        right.confidence - left.confidence || left.filePath.localeCompare(right.filePath),
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, artifactId: string): Promise<boolean> {
    const key = recordKey(workspaceId, artifactId);
    const existing = this.store.get(key);
    if (!existing) {
      return false;
    }
    this.fileIndex.delete(
      `${workspaceId}:${existing.generatedStorefrontId}:${existing.filePath}`,
    );
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory artifact repository. */
export function createInMemoryArtifactRepository(): InMemoryArtifactRepository {
  return new InMemoryArtifactRepository();
}
