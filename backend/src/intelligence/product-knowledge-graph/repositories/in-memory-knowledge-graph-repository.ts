import { randomUUID } from "node:crypto";

import {
  normalizeProductAlias,
  type ProductAlias,
  type ProductAliasCreateInput,
} from "../models/product-alias.js";
import {
  normalizeProductCategorySlug,
  type ProductCategory,
  type ProductCategoryCreateInput,
  type ProductCategoryUpdateInput,
} from "../models/product-category.js";
import type {
  ProductEntity,
  ProductEntityCreateInput,
  ProductEntityUpdateInput,
} from "../models/product-entity.js";
import type {
  ProductRelationship,
  ProductRelationshipCreateInput,
} from "../models/product-relationship.js";
import type {
  KnowledgeGraphRepository,
  ProductAliasQuery,
  ProductCategoryQuery,
  ProductEntityQuery,
  ProductRelationshipQuery,
} from "./knowledge-graph-repository.js";

function storageKey(workspaceId: string, id: string): string {
  return `${workspaceId}:${id}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

class InMemoryProductEntityRepository {
  private readonly store = new Map<string, ProductEntity>();

  async create(workspaceId: string, input: ProductEntityCreateInput): Promise<ProductEntity> {
    const timestamp = nowIso();
    const entity: ProductEntity = {
      id: randomUUID(),
      workspaceId,
      canonicalSlug: input.canonicalSlug,
      displayName: input.displayName,
      description: input.description,
      categoryId: input.categoryId,
      targetBuyerPersonaIds: [...input.targetBuyerPersonaIds],
      supplierRefs: input.supplierRefs.map((ref) => ({ ...ref })),
      sourceObservationIds: [...input.sourceObservationIds],
      confidence: input.confidence,
      tags: [...input.tags],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.store.set(storageKey(workspaceId, entity.id), entity);
    return structuredClone(entity);
  }

  async getById(workspaceId: string, id: string): Promise<ProductEntity | null> {
    const entity = this.store.get(storageKey(workspaceId, id));
    return entity ? structuredClone(entity) : null;
  }

  async getByCanonicalSlug(
    workspaceId: string,
    canonicalSlug: string,
  ): Promise<ProductEntity | null> {
    for (const entity of this.store.values()) {
      if (entity.workspaceId === workspaceId && entity.canonicalSlug === canonicalSlug) {
        return structuredClone(entity);
      }
    }
    return null;
  }

  async update(
    workspaceId: string,
    id: string,
    input: ProductEntityUpdateInput,
  ): Promise<ProductEntity> {
    const key = storageKey(workspaceId, id);
    const existing = this.store.get(key);
    if (!existing) {
      throw new Error(`ProductEntity not found: ${id}`);
    }

    const updated: ProductEntity = {
      ...existing,
      displayName: input.displayName ?? existing.displayName,
      canonicalSlug: input.canonicalSlug ?? existing.canonicalSlug,
      description: input.description ?? existing.description,
      categoryId: input.categoryId ?? existing.categoryId,
      targetBuyerPersonaIds: input.targetBuyerPersonaIds
        ? [...input.targetBuyerPersonaIds]
        : existing.targetBuyerPersonaIds,
      supplierRefs: input.supplierRefs
        ? input.supplierRefs.map((ref) => ({ ...ref }))
        : existing.supplierRefs,
      sourceObservationIds: input.sourceObservationIds
        ? [...input.sourceObservationIds]
        : existing.sourceObservationIds,
      confidence: input.confidence ?? existing.confidence,
      tags: input.tags ? [...input.tags] : existing.tags,
      updatedAt: nowIso(),
    };
    this.store.set(key, updated);
    return structuredClone(updated);
  }

  async delete(workspaceId: string, id: string): Promise<boolean> {
    return this.store.delete(storageKey(workspaceId, id));
  }

  async list(query: ProductEntityQuery): Promise<ProductEntity[]> {
    let results = [...this.store.values()].filter(
      (entity) => entity.workspaceId === query.workspaceId,
    );

    if (query.canonicalSlug) {
      results = results.filter((entity) => entity.canonicalSlug === query.canonicalSlug);
    }
    if (query.categoryId) {
      results = results.filter((entity) => entity.categoryId === query.categoryId);
    }
    if (query.buyerPersonaId) {
      results = results.filter((entity) =>
        entity.targetBuyerPersonaIds.includes(query.buyerPersonaId!),
      );
    }
    if (query.supplierId) {
      results = results.filter((entity) =>
        entity.supplierRefs.some((ref) => ref.supplierId === query.supplierId),
      );
    }
    if (query.tag) {
      results = results.filter((entity) => entity.tags.includes(query.tag!));
    }

    return paginate(results.map((entity) => structuredClone(entity)), query.limit, query.offset);
  }
}

class InMemoryProductAliasRepository {
  private readonly store = new Map<string, ProductAlias>();

  async create(workspaceId: string, input: ProductAliasCreateInput): Promise<ProductAlias> {
    const alias: ProductAlias = {
      id: randomUUID(),
      workspaceId,
      productEntityId: input.productEntityId,
      aliasText: input.aliasText,
      normalizedAlias: input.normalizedAlias ?? normalizeProductAlias(input.aliasText),
      source: input.source,
      createdAt: nowIso(),
    };
    this.store.set(storageKey(workspaceId, alias.id), alias);
    return structuredClone(alias);
  }

  async getById(workspaceId: string, id: string): Promise<ProductAlias | null> {
    const alias = this.store.get(storageKey(workspaceId, id));
    return alias ? structuredClone(alias) : null;
  }

  async findByNormalizedAlias(
    workspaceId: string,
    normalizedAlias: string,
  ): Promise<ProductAlias | null> {
    for (const alias of this.store.values()) {
      if (alias.workspaceId === workspaceId && alias.normalizedAlias === normalizedAlias) {
        return structuredClone(alias);
      }
    }
    return null;
  }

  async list(query: ProductAliasQuery): Promise<ProductAlias[]> {
    let results = [...this.store.values()].filter(
      (alias) => alias.workspaceId === query.workspaceId,
    );

    if (query.productEntityId) {
      results = results.filter((alias) => alias.productEntityId === query.productEntityId);
    }
    if (query.normalizedAlias) {
      results = results.filter((alias) => alias.normalizedAlias === query.normalizedAlias);
    }

    return paginate(results.map((alias) => structuredClone(alias)), query.limit, query.offset);
  }

  async delete(workspaceId: string, id: string): Promise<boolean> {
    return this.store.delete(storageKey(workspaceId, id));
  }
}

class InMemoryProductRelationshipRepository {
  private readonly store = new Map<string, ProductRelationship>();

  async create(
    workspaceId: string,
    input: ProductRelationshipCreateInput,
  ): Promise<ProductRelationship> {
    const relationship: ProductRelationship = {
      id: randomUUID(),
      workspaceId,
      sourceProductId: input.sourceProductId,
      targetProductId: input.targetProductId,
      relationshipType: input.relationshipType,
      strength: input.strength,
      notes: input.notes,
      createdAt: nowIso(),
    };
    this.store.set(storageKey(workspaceId, relationship.id), relationship);
    return structuredClone(relationship);
  }

  async getById(workspaceId: string, id: string): Promise<ProductRelationship | null> {
    const relationship = this.store.get(storageKey(workspaceId, id));
    return relationship ? structuredClone(relationship) : null;
  }

  async list(query: ProductRelationshipQuery): Promise<ProductRelationship[]> {
    let results = [...this.store.values()].filter(
      (relationship) => relationship.workspaceId === query.workspaceId,
    );

    if (query.sourceProductId) {
      results = results.filter(
        (relationship) => relationship.sourceProductId === query.sourceProductId,
      );
    }
    if (query.targetProductId) {
      results = results.filter(
        (relationship) => relationship.targetProductId === query.targetProductId,
      );
    }
    if (query.relationshipType) {
      results = results.filter(
        (relationship) => relationship.relationshipType === query.relationshipType,
      );
    }

    return paginate(
      results.map((relationship) => structuredClone(relationship)),
      query.limit,
      query.offset,
    );
  }

  async delete(workspaceId: string, id: string): Promise<boolean> {
    return this.store.delete(storageKey(workspaceId, id));
  }
}

class InMemoryProductCategoryRepository {
  private readonly store = new Map<string, ProductCategory>();

  async create(workspaceId: string, input: ProductCategoryCreateInput): Promise<ProductCategory> {
    const timestamp = nowIso();
    const slug = input.slug ?? normalizeProductCategorySlug(input.name);
    const path =
      input.path ??
      (input.parentCategoryId
        ? await this.buildCategoryPath(workspaceId, input.parentCategoryId, slug)
        : [slug]);

    const category: ProductCategory = {
      id: randomUUID(),
      workspaceId,
      name: input.name,
      slug,
      parentCategoryId: input.parentCategoryId,
      path,
      description: input.description,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.store.set(storageKey(workspaceId, category.id), category);
    return structuredClone(category);
  }

  private async buildCategoryPath(
    workspaceId: string,
    parentCategoryId: string,
    slug: string,
  ): Promise<string[]> {
    const parent = await this.getById(workspaceId, parentCategoryId);
    if (!parent) {
      return [slug];
    }
    return [...parent.path, slug];
  }

  async getById(workspaceId: string, id: string): Promise<ProductCategory | null> {
    const category = this.store.get(storageKey(workspaceId, id));
    return category ? structuredClone(category) : null;
  }

  async getBySlug(workspaceId: string, slug: string): Promise<ProductCategory | null> {
    for (const category of this.store.values()) {
      if (category.workspaceId === workspaceId && category.slug === slug) {
        return structuredClone(category);
      }
    }
    return null;
  }

  async update(
    workspaceId: string,
    id: string,
    input: ProductCategoryUpdateInput,
  ): Promise<ProductCategory> {
    const key = storageKey(workspaceId, id);
    const existing = this.store.get(key);
    if (!existing) {
      throw new Error(`ProductCategory not found: ${id}`);
    }

    const slug = input.slug ?? (input.name ? normalizeProductCategorySlug(input.name) : existing.slug);
    const parentCategoryId =
      input.parentCategoryId !== undefined ? input.parentCategoryId : existing.parentCategoryId;
    const path =
      input.path ??
      (parentCategoryId
        ? await this.buildCategoryPath(workspaceId, parentCategoryId, slug)
        : [slug]);

    const updated: ProductCategory = {
      ...existing,
      name: input.name ?? existing.name,
      slug,
      parentCategoryId,
      path,
      description: input.description ?? existing.description,
      updatedAt: nowIso(),
    };
    this.store.set(key, updated);
    return structuredClone(updated);
  }

  async delete(workspaceId: string, id: string): Promise<boolean> {
    return this.store.delete(storageKey(workspaceId, id));
  }

  async list(query: ProductCategoryQuery): Promise<ProductCategory[]> {
    let results = [...this.store.values()].filter(
      (category) => category.workspaceId === query.workspaceId,
    );

    if (query.slug) {
      results = results.filter((category) => category.slug === query.slug);
    }
    if (query.parentCategoryId !== undefined) {
      results = results.filter(
        (category) => category.parentCategoryId === query.parentCategoryId,
      );
    }

    return paginate(results.map((category) => structuredClone(category)), query.limit, query.offset);
  }
}

/** In-memory KnowledgeGraphRepository for Mission 024 tests and local development. */
export class InMemoryKnowledgeGraphRepository implements KnowledgeGraphRepository {
  readonly entities = new InMemoryProductEntityRepository();
  readonly aliases = new InMemoryProductAliasRepository();
  readonly relationships = new InMemoryProductRelationshipRepository();
  readonly categories = new InMemoryProductCategoryRepository();
}

/** Factory for a fresh in-memory knowledge graph repository. */
export function createInMemoryKnowledgeGraphRepository(): InMemoryKnowledgeGraphRepository {
  return new InMemoryKnowledgeGraphRepository();
}
