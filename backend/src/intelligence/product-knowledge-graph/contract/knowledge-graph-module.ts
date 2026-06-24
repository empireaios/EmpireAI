/**
 * Product Knowledge Graph module contract — canonical product identity across data sources.
 */

import type { ProductAlias, ProductAliasCreateInput } from "../models/product-alias.js";
import type { ProductCategory, ProductCategoryCreateInput } from "../models/product-category.js";
import type { ProductEntity, ProductEntityCreateInput } from "../models/product-entity.js";
import type {
  ProductRelationship,
  ProductRelationshipCreateInput,
  ProductRelationshipType,
} from "../models/product-relationship.js";
import {
  KnowledgeGraphMapper,
  defaultKnowledgeGraphMapper,
  type RegisterProductAliasesInput,
} from "../mappers/knowledge-graph-mapper.js";
import type { KnowledgeGraphRepository } from "../repositories/knowledge-graph-repository.js";
import { createInMemoryKnowledgeGraphRepository } from "../repositories/in-memory-knowledge-graph-repository.js";

export const KNOWLEDGE_GRAPH_MODULE_ID = "product-knowledge-graph" as const;
export type KnowledgeGraphModuleId = typeof KNOWLEDGE_GRAPH_MODULE_ID;

export const KNOWLEDGE_GRAPH_MODULE_VERSION = "0.1.0" as const;

export type KnowledgeGraphCapability =
  | "product-knowledge-graph.entity.resolve"
  | "product-knowledge-graph.entity.upsert"
  | "product-knowledge-graph.alias.register"
  | "product-knowledge-graph.alias.resolve"
  | "product-knowledge-graph.relationship.create"
  | "product-knowledge-graph.relationship.list"
  | "product-knowledge-graph.category.upsert"
  | "product-knowledge-graph.category.hierarchy";

export const KNOWLEDGE_GRAPH_CAPABILITIES: readonly KnowledgeGraphCapability[] = [
  "product-knowledge-graph.entity.resolve",
  "product-knowledge-graph.entity.upsert",
  "product-knowledge-graph.alias.register",
  "product-knowledge-graph.alias.resolve",
  "product-knowledge-graph.relationship.create",
  "product-knowledge-graph.relationship.list",
  "product-knowledge-graph.category.upsert",
  "product-knowledge-graph.category.hierarchy",
] as const;

export type KnowledgeGraphModuleContract = {
  moduleId: KnowledgeGraphModuleId;
  version: string;
  capabilities: readonly KnowledgeGraphCapability[];
};

export const KNOWLEDGE_GRAPH_MODULE_CONTRACT: KnowledgeGraphModuleContract = {
  moduleId: KNOWLEDGE_GRAPH_MODULE_ID,
  version: KNOWLEDGE_GRAPH_MODULE_VERSION,
  capabilities: KNOWLEDGE_GRAPH_CAPABILITIES,
};

export type ResolveProductByAliasResult = {
  entity: ProductEntity;
  matchedAlias: ProductAlias;
};

export type RegisterProductResult = {
  entity: ProductEntity;
  aliases: ProductAlias[];
};

/** Orchestrates canonical product identity, aliases, relationships, and categories. */
export class KnowledgeGraphModule {
  readonly contract = KNOWLEDGE_GRAPH_MODULE_CONTRACT;

  constructor(
    private readonly repository: KnowledgeGraphRepository,
    private readonly mapper: KnowledgeGraphMapper = defaultKnowledgeGraphMapper,
  ) {}

  normalizeAlias(text: string): string {
    return this.mapper.normalizeAlias(text);
  }

  generateCanonicalSlug(aliases: string[], primaryDisplayName?: string): string {
    return this.mapper.generateCanonicalSlug(aliases, primaryDisplayName);
  }

  async resolveProductByAlias(
    workspaceId: string,
    aliasText: string,
  ): Promise<ResolveProductByAliasResult | null> {
    const normalizedAlias = this.mapper.normalizeAlias(aliasText);
    const alias = await this.repository.aliases.findByNormalizedAlias(workspaceId, normalizedAlias);
    if (!alias) {
      return null;
    }

    const entity = await this.repository.entities.getById(workspaceId, alias.productEntityId);
    if (!entity) {
      return null;
    }

    return { entity, matchedAlias: alias };
  }

  async upsertProductFromAliases(
    workspaceId: string,
    input: RegisterProductAliasesInput,
  ): Promise<RegisterProductResult> {
    const entityInput = this.mapper.mapAliasesToEntityInput(input);
    const existing = await this.repository.entities.getByCanonicalSlug(
      workspaceId,
      entityInput.canonicalSlug,
    );

    const entity = existing
      ? await this.repository.entities.update(workspaceId, existing.id, entityInput)
      : await this.repository.entities.create(workspaceId, entityInput);

    const aliases: ProductAlias[] = [];
    for (const aliasText of input.aliases) {
      const normalizedAlias = this.mapper.normalizeAlias(aliasText);
      const existingAlias = await this.repository.aliases.findByNormalizedAlias(
        workspaceId,
        normalizedAlias,
      );

      if (existingAlias && existingAlias.productEntityId === entity.id) {
        aliases.push(existingAlias);
        continue;
      }

      const aliasInput: ProductAliasCreateInput = {
        productEntityId: entity.id,
        aliasText,
        normalizedAlias,
      };
      aliases.push(await this.repository.aliases.create(workspaceId, aliasInput));
    }

    return { entity, aliases };
  }

  async registerAlias(
    workspaceId: string,
    productEntityId: string,
    aliasText: string,
    source?: string,
  ): Promise<ProductAlias> {
    return this.repository.aliases.create(workspaceId, {
      productEntityId,
      aliasText,
      normalizedAlias: this.mapper.normalizeAlias(aliasText),
      source,
    });
  }

  async createRelationship(
    workspaceId: string,
    input: ProductRelationshipCreateInput,
  ): Promise<ProductRelationship> {
    return this.repository.relationships.create(workspaceId, input);
  }

  async listRelatedProducts(
    workspaceId: string,
    productId: string,
    relationshipType?: ProductRelationshipType,
  ): Promise<ProductRelationship[]> {
    return this.repository.relationships.list({
      workspaceId,
      sourceProductId: productId,
      relationshipType,
    });
  }

  async listSubstituteProducts(
    workspaceId: string,
    productId: string,
  ): Promise<ProductRelationship[]> {
    return this.listRelatedProducts(workspaceId, productId, "substitute");
  }

  async listComplementaryProducts(
    workspaceId: string,
    productId: string,
  ): Promise<ProductRelationship[]> {
    return this.listRelatedProducts(workspaceId, productId, "complementary");
  }

  async upsertCategory(
    workspaceId: string,
    input: ProductCategoryCreateInput,
  ): Promise<ProductCategory> {
    const slug = input.slug ?? this.mapper.aliasToSlug(input.name);
    const existing = await this.repository.categories.getBySlug(workspaceId, slug);
    if (existing) {
      return this.repository.categories.update(workspaceId, existing.id, input);
    }
    return this.repository.categories.create(workspaceId, input);
  }

  async getCategoryHierarchy(
    workspaceId: string,
    categoryId: string,
  ): Promise<ProductCategory[]> {
    const category = await this.repository.categories.getById(workspaceId, categoryId);
    if (!category) {
      return [];
    }

    const allCategories = await this.repository.categories.list({ workspaceId });
    const hierarchy: ProductCategory[] = [];

    for (const slug of category.path) {
      const match = allCategories.find((entry) => entry.slug === slug);
      if (match) {
        hierarchy.push(match);
      }
    }

    if (!hierarchy.some((entry) => entry.id === category.id)) {
      hierarchy.push(category);
    }

    return hierarchy.filter((entry, index, list) => list.findIndex((item) => item.id === entry.id) === index);
  }

  async createEntity(
    workspaceId: string,
    input: ProductEntityCreateInput,
  ): Promise<ProductEntity> {
    return this.repository.entities.create(workspaceId, input);
  }
}

/** Default in-memory module instance for tests and local development. */
export function createKnowledgeGraphModule(
  repository: KnowledgeGraphRepository = createInMemoryKnowledgeGraphRepository(),
  mapper: KnowledgeGraphMapper = defaultKnowledgeGraphMapper,
): KnowledgeGraphModule {
  return new KnowledgeGraphModule(repository, mapper);
}

export const knowledgeGraphModule = createKnowledgeGraphModule();
