import { randomUUID } from "node:crypto";

import type {
  StoreBlueprint,
  StoreBlueprintCreateInput,
} from "../models/store-blueprint.js";
import type {
  StoreBlueprintRepository,
  StoreBlueprintRepositoryQuery,
} from "./store-blueprint-repository.js";

function recordKey(workspaceId: string, storeId: string): string {
  return `${workspaceId}:store:${storeId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

function clonePage<T extends { bullets: string[]; productIds: string[] }>(page: T): T {
  return {
    ...page,
    bullets: [...page.bullets],
    productIds: [...page.productIds],
  };
}

/** In-memory StoreBlueprintRepository for Mission 051 tests and local development. */
export class InMemoryStoreBlueprintRepository implements StoreBlueprintRepository {
  private readonly store = new Map<string, StoreBlueprint>();
  private readonly brandIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: StoreBlueprintCreateInput,
  ): Promise<StoreBlueprint> {
    const brandKey = `${workspaceId}:${input.brandId}`;
    const existingId = this.brandIndex.get(brandKey);
    const timestamp = nowIso();

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: StoreBlueprint = {
          ...existing,
          homepage: clonePage(input.homepage),
          collectionPages: input.collectionPages.map(clonePage),
          productPages: input.productPages.map(clonePage),
          aboutPage: clonePage(input.aboutPage),
          faqPage: clonePage(input.faqPage),
          contactPage: clonePage(input.contactPage),
          navigation: {
            ...input.navigation,
            primaryLinks: input.navigation.primaryLinks.map((link) => ({ ...link })),
            footerLinks: input.navigation.footerLinks.map((link) => ({ ...link })),
          },
          confidence: input.confidence,
          signals: input.signals.map((signal) => ({ ...signal })),
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        return structuredClone(updated);
      }
    }

    const record: StoreBlueprint = {
      storeId: randomUUID(),
      workspaceId,
      brandId: input.brandId,
      homepage: clonePage(input.homepage),
      collectionPages: input.collectionPages.map(clonePage),
      productPages: input.productPages.map(clonePage),
      aboutPage: clonePage(input.aboutPage),
      faqPage: clonePage(input.faqPage),
      contactPage: clonePage(input.contactPage),
      navigation: {
        ...input.navigation,
        primaryLinks: input.navigation.primaryLinks.map((link) => ({ ...link })),
        footerLinks: input.navigation.footerLinks.map((link) => ({ ...link })),
      },
      confidence: input.confidence,
      signals: input.signals.map((signal) => ({ ...signal })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.storeId), record);
    this.brandIndex.set(brandKey, record.storeId);
    return structuredClone(record);
  }

  async getById(workspaceId: string, storeId: string): Promise<StoreBlueprint | null> {
    const record = this.store.get(recordKey(workspaceId, storeId));
    return record ? structuredClone(record) : null;
  }

  async getByBrand(workspaceId: string, brandId: string): Promise<StoreBlueprint | null> {
    const storeId = this.brandIndex.get(`${workspaceId}:${brandId}`);
    if (!storeId) {
      return null;
    }
    return this.getById(workspaceId, storeId);
  }

  async list(query: StoreBlueprintRepositoryQuery): Promise<StoreBlueprint[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    if (query.brandId) {
      results = results.filter((record) => record.brandId === query.brandId);
    }
    if (query.minConfidence !== undefined) {
      results = results.filter((record) => record.confidence >= query.minConfidence!);
    }

    results.sort(
      (left, right) =>
        right.confidence - left.confidence || left.brandId.localeCompare(right.brandId),
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, storeId: string): Promise<boolean> {
    const key = recordKey(workspaceId, storeId);
    const existing = this.store.get(key);
    if (!existing) {
      return false;
    }
    this.brandIndex.delete(`${workspaceId}:${existing.brandId}`);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory store blueprint repository. */
export function createInMemoryStoreBlueprintRepository(): InMemoryStoreBlueprintRepository {
  return new InMemoryStoreBlueprintRepository();
}
