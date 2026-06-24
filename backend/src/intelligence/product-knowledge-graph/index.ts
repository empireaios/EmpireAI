export {
  productEntitySchema,
  validateProductEntity,
} from "./models/product-entity.js";
export type {
  ProductEntity,
  ProductEntityId,
  ProductEntityCreateInput,
  ProductEntityUpdateInput,
  ProductSupplierRef,
} from "./models/product-entity.js";

export {
  productAliasSchema,
  validateProductAlias,
  normalizeProductAlias,
  tokenizeProductAlias,
  aliasTokensToSlug,
} from "./models/product-alias.js";
export type {
  ProductAlias,
  ProductAliasId,
  ProductAliasCreateInput,
} from "./models/product-alias.js";

export {
  productRelationshipSchema,
  validateProductRelationship,
  PRODUCT_RELATIONSHIP_TYPES,
} from "./models/product-relationship.js";
export type {
  ProductRelationship,
  ProductRelationshipId,
  ProductRelationshipType,
  ProductRelationshipCreateInput,
} from "./models/product-relationship.js";

export {
  productCategorySchema,
  validateProductCategory,
  normalizeProductCategorySlug,
} from "./models/product-category.js";
export type {
  ProductCategory,
  ProductCategoryId,
  ProductCategoryCreateInput,
  ProductCategoryUpdateInput,
} from "./models/product-category.js";

export type {
  KnowledgeGraphListQuery,
  ProductEntityQuery,
  ProductAliasQuery,
  ProductRelationshipQuery,
  ProductCategoryQuery,
  ProductEntityRepository,
  ProductAliasRepository,
  ProductRelationshipRepository,
  ProductCategoryRepository,
  KnowledgeGraphRepository,
} from "./repositories/knowledge-graph-repository.js";

export {
  InMemoryKnowledgeGraphRepository,
  createInMemoryKnowledgeGraphRepository,
} from "./repositories/in-memory-knowledge-graph-repository.js";

export {
  KnowledgeGraphMapper,
  defaultKnowledgeGraphMapper,
} from "./mappers/knowledge-graph-mapper.js";
export type {
  CanonicalProductResolution,
  RegisterProductAliasesInput,
} from "./mappers/knowledge-graph-mapper.js";

export {
  KNOWLEDGE_GRAPH_MODULE_ID,
  KNOWLEDGE_GRAPH_MODULE_VERSION,
  KNOWLEDGE_GRAPH_CAPABILITIES,
  KNOWLEDGE_GRAPH_MODULE_CONTRACT,
  KnowledgeGraphModule,
  createKnowledgeGraphModule,
  knowledgeGraphModule,
} from "./contract/knowledge-graph-module.js";
export type {
  KnowledgeGraphModuleId,
  KnowledgeGraphCapability,
  KnowledgeGraphModuleContract,
  ResolveProductByAliasResult,
  RegisterProductResult,
} from "./contract/knowledge-graph-module.js";
