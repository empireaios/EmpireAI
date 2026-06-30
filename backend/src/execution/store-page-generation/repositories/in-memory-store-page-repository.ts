import { randomUUID } from "node:crypto";

import type {
  RenderableStorePage,
  RenderableStorePageCreateInput,
} from "../models/renderable-store-page.js";
import type {
  StorePageRepository,
  StorePageRepositoryQuery,
} from "./store-page-repository.js";

function recordKey(workspaceId: string, renderablePageId: string): string {
  return `${workspaceId}:renderable-page:${renderablePageId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

function cloneSection(section: RenderableStorePageCreateInput["sections"][number]) {
  return {
    ...section,
    bullets: [...section.bullets],
  };
}

function cloneInput(input: RenderableStorePageCreateInput): RenderableStorePageCreateInput {
  return {
    ...input,
    metadata: {
      ...input.metadata,
      keywords: [...input.metadata.keywords],
    },
    sections: input.sections.map(cloneSection),
    signals: input.signals.map((signal) => ({ ...signal })),
    renderPayload: structuredClone(input.renderPayload),
  };
}

/** In-memory StorePageRepository for Mission 052 tests and local development. */
export class InMemoryStorePageRepository implements StorePageRepository {
  private readonly store = new Map<string, RenderableStorePage>();
  private readonly pageIndex = new Map<string, string>();
  private readonly routeIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: RenderableStorePageCreateInput,
  ): Promise<RenderableStorePage> {
    const pageKey = `${workspaceId}:${input.pageId}`;
    const routeKey = `${workspaceId}:${input.route}`;
    const existingId = this.pageIndex.get(pageKey);
    const timestamp = nowIso();
    const cloned = cloneInput(input);

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: RenderableStorePage = {
          ...existing,
          ...cloned,
          renderablePageId: existing.renderablePageId,
          workspaceId: existing.workspaceId,
          createdAt: existing.createdAt,
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        this.routeIndex.set(routeKey, existing.renderablePageId);
        return structuredClone(updated);
      }
    }

    const record: RenderableStorePage = {
      renderablePageId: randomUUID(),
      workspaceId,
      ...cloned,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.renderablePageId), record);
    this.pageIndex.set(pageKey, record.renderablePageId);
    this.routeIndex.set(routeKey, record.renderablePageId);
    return structuredClone(record);
  }

  async saveMany(
    workspaceId: string,
    inputs: RenderableStorePageCreateInput[],
  ): Promise<RenderableStorePage[]> {
    const saved: RenderableStorePage[] = [];
    for (const input of inputs) {
      saved.push(await this.save(workspaceId, input));
    }
    return saved;
  }

  async getById(
    workspaceId: string,
    renderablePageId: string,
  ): Promise<RenderableStorePage | null> {
    const record = this.store.get(recordKey(workspaceId, renderablePageId));
    return record ? structuredClone(record) : null;
  }

  async getByPage(workspaceId: string, pageId: string): Promise<RenderableStorePage | null> {
    const renderablePageId = this.pageIndex.get(`${workspaceId}:${pageId}`);
    if (!renderablePageId) {
      return null;
    }
    return this.getById(workspaceId, renderablePageId);
  }

  async getByRoute(workspaceId: string, route: string): Promise<RenderableStorePage | null> {
    const renderablePageId = this.routeIndex.get(`${workspaceId}:${route}`);
    if (!renderablePageId) {
      return null;
    }
    return this.getById(workspaceId, renderablePageId);
  }

  async list(query: StorePageRepositoryQuery): Promise<RenderableStorePage[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    if (query.storeId) {
      results = results.filter((record) => record.storeId === query.storeId);
    }
    if (query.brandId) {
      results = results.filter((record) => record.brandId === query.brandId);
    }
    if (query.pageId) {
      results = results.filter((record) => record.pageId === query.pageId);
    }
    if (query.route) {
      results = results.filter((record) => record.route === query.route);
    }
    if (query.pageType) {
      results = results.filter((record) => record.pageType === query.pageType);
    }
    if (query.minConfidence !== undefined) {
      results = results.filter((record) => record.confidence >= query.minConfidence!);
    }

    results.sort(
      (left, right) =>
        right.confidence - left.confidence || left.route.localeCompare(right.route),
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, renderablePageId: string): Promise<boolean> {
    const key = recordKey(workspaceId, renderablePageId);
    const existing = this.store.get(key);
    if (!existing) {
      return false;
    }
    this.pageIndex.delete(`${workspaceId}:${existing.pageId}`);
    this.routeIndex.delete(`${workspaceId}:${existing.route}`);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory store page repository. */
export function createInMemoryStorePageRepository(): InMemoryStorePageRepository {
  return new InMemoryStorePageRepository();
}
