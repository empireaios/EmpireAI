import { randomUUID } from "node:crypto";

import type { Storefront, StorefrontCreateInput } from "../models/storefront.js";
import type {
  StorefrontRepository,
  StorefrontRepositoryQuery,
} from "./storefront-repository.js";

function recordKey(workspaceId: string, storefrontId: string): string {
  return `${workspaceId}:storefront:${storefrontId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

function cloneInput(input: StorefrontCreateInput): StorefrontCreateInput {
  return {
    ...input,
    routes: input.routes.map((route) => ({ ...route })),
    navigation: {
      ...input.navigation,
      primaryLinks: input.navigation.primaryLinks.map((link) => ({ ...link })),
      footerLinks: input.navigation.footerLinks.map((link) => ({ ...link })),
    },
    assets: input.assets.map((asset) => ({ ...asset })),
    pageMap: { ...input.pageMap },
    seoMap: Object.fromEntries(
      Object.entries(input.seoMap).map(([route, metadata]) => [
        route,
        {
          ...metadata,
          keywords: [...metadata.keywords],
        },
      ]),
    ),
    signals: input.signals.map((signal) => ({ ...signal })),
  };
}

/** In-memory StorefrontRepository for Mission 053 tests and local development. */
export class InMemoryStorefrontRepository implements StorefrontRepository {
  private readonly store = new Map<string, Storefront>();
  private readonly storeIndex = new Map<string, string>();
  private readonly brandIndex = new Map<string, string>();

  async save(workspaceId: string, input: StorefrontCreateInput): Promise<Storefront> {
    const storeKey = `${workspaceId}:${input.storeId}`;
    const brandKey = `${workspaceId}:${input.brandId}`;
    const existingId = this.storeIndex.get(storeKey);
    const timestamp = nowIso();
    const cloned = cloneInput(input);

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: Storefront = {
          ...existing,
          ...cloned,
          storefrontId: existing.storefrontId,
          workspaceId: existing.workspaceId,
          createdAt: existing.createdAt,
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        this.brandIndex.set(brandKey, existing.storefrontId);
        return structuredClone(updated);
      }
    }

    const record: Storefront = {
      storefrontId: randomUUID(),
      workspaceId,
      ...cloned,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.storefrontId), record);
    this.storeIndex.set(storeKey, record.storefrontId);
    this.brandIndex.set(brandKey, record.storefrontId);
    return structuredClone(record);
  }

  async getById(workspaceId: string, storefrontId: string): Promise<Storefront | null> {
    const record = this.store.get(recordKey(workspaceId, storefrontId));
    return record ? structuredClone(record) : null;
  }

  async getByStore(workspaceId: string, storeId: string): Promise<Storefront | null> {
    const storefrontId = this.storeIndex.get(`${workspaceId}:${storeId}`);
    if (!storefrontId) {
      return null;
    }
    return this.getById(workspaceId, storefrontId);
  }

  async getByBrand(workspaceId: string, brandId: string): Promise<Storefront | null> {
    const storefrontId = this.brandIndex.get(`${workspaceId}:${brandId}`);
    if (!storefrontId) {
      return null;
    }
    return this.getById(workspaceId, storefrontId);
  }

  async list(query: StorefrontRepositoryQuery): Promise<Storefront[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

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
        right.confidence - left.confidence || left.storeId.localeCompare(right.storeId),
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, storefrontId: string): Promise<boolean> {
    const key = recordKey(workspaceId, storefrontId);
    const existing = this.store.get(key);
    if (!existing) {
      return false;
    }
    this.storeIndex.delete(`${workspaceId}:${existing.storeId}`);
    this.brandIndex.delete(`${workspaceId}:${existing.brandId}`);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory storefront repository. */
export function createInMemoryStorefrontRepository(): InMemoryStorefrontRepository {
  return new InMemoryStorefrontRepository();
}
