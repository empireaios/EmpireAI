import type { ProductAlias, ProductAliasCreateInput } from "../models/product-alias.js";
import type {
  ProductCategory,
  ProductCategoryCreateInput,
  ProductCategoryUpdateInput,
} from "../models/product-category.js";
import type {
  ProductEntity,
  ProductEntityCreateInput,
  ProductEntityUpdateInput,
} from "../models/product-entity.js";
import type {
  ProductRelationship,
  ProductRelationshipCreateInput,
  ProductRelationshipType,
} from "../models/product-relationship.js";

export type KnowledgeGraphListQuery = {
  workspaceId: string;
  limit?: number;
  offset?: number;
};

export type ProductEntityQuery = KnowledgeGraphListQuery & {
  canonicalSlug?: string;
  categoryId?: string;
  buyerPersonaId?: string;
  supplierId?: string;
  tag?: string;
};

export type ProductAliasQuery = KnowledgeGraphListQuery & {
  productEntityId?: string;
  normalizedAlias?: string;
};

export type ProductRelationshipQuery = KnowledgeGraphListQuery & {
  sourceProductId?: string;
  targetProductId?: string;
  relationshipType?: ProductRelationshipType;
};

export type ProductCategoryQuery = KnowledgeGraphListQuery & {
  slug?: string;
  parentCategoryId?: string | null;
};

export interface ProductEntityRepository {
  create(workspaceId: string, input: ProductEntityCreateInput): Promise<ProductEntity>;
  getById(workspaceId: string, id: string): Promise<ProductEntity | null>;
  getByCanonicalSlug(workspaceId: string, canonicalSlug: string): Promise<ProductEntity | null>;
  update(workspaceId: string, id: string, input: ProductEntityUpdateInput): Promise<ProductEntity>;
  delete(workspaceId: string, id: string): Promise<boolean>;
  list(query: ProductEntityQuery): Promise<ProductEntity[]>;
}

export interface ProductAliasRepository {
  create(workspaceId: string, input: ProductAliasCreateInput): Promise<ProductAlias>;
  getById(workspaceId: string, id: string): Promise<ProductAlias | null>;
  findByNormalizedAlias(workspaceId: string, normalizedAlias: string): Promise<ProductAlias | null>;
  list(query: ProductAliasQuery): Promise<ProductAlias[]>;
  delete(workspaceId: string, id: string): Promise<boolean>;
}

export interface ProductRelationshipRepository {
  create(workspaceId: string, input: ProductRelationshipCreateInput): Promise<ProductRelationship>;
  getById(workspaceId: string, id: string): Promise<ProductRelationship | null>;
  list(query: ProductRelationshipQuery): Promise<ProductRelationship[]>;
  delete(workspaceId: string, id: string): Promise<boolean>;
}

export interface ProductCategoryRepository {
  create(workspaceId: string, input: ProductCategoryCreateInput): Promise<ProductCategory>;
  getById(workspaceId: string, id: string): Promise<ProductCategory | null>;
  getBySlug(workspaceId: string, slug: string): Promise<ProductCategory | null>;
  update(workspaceId: string, id: string, input: ProductCategoryUpdateInput): Promise<ProductCategory>;
  delete(workspaceId: string, id: string): Promise<boolean>;
  list(query: ProductCategoryQuery): Promise<ProductCategory[]>;
}

/** Aggregated repository surface for Product Knowledge Graph persistence. */
export interface KnowledgeGraphRepository {
  readonly entities: ProductEntityRepository;
  readonly aliases: ProductAliasRepository;
  readonly relationships: ProductRelationshipRepository;
  readonly categories: ProductCategoryRepository;
}
