/**
 * Product Offer Generation module — converts products into sellable offers.
 */

import {
  ProductOfferGenerationEngine,
  defaultProductOfferGenerationEngine,
  type ProductOfferGenerationInput,
} from "../engines/product-offer-generation-engine.js";
import type { ProductOffer } from "../models/product-offer.js";
import {
  offerScoring,
  scoreProductOffer,
  scoreProductOffers,
  type OfferBrandInput,
  type OfferBrandProductInput,
  type OfferProductKnowledgeInput,
} from "../scoring/offer-scoring.js";
import type { OfferRepository, OfferRepositoryQuery } from "../repositories/offer-repository.js";
import { createInMemoryOfferRepository } from "../repositories/in-memory-offer-repository.js";

export const PRODUCT_OFFER_GENERATION_MODULE_ID = "product-offer-generation" as const;
export type ProductOfferGenerationModuleId = typeof PRODUCT_OFFER_GENERATION_MODULE_ID;

export const PRODUCT_OFFER_GENERATION_MODULE_VERSION = "0.1.0" as const;

export type ProductOfferGenerationCapability =
  | "product-offer-generation.generate"
  | "product-offer-generation.score"
  | "product-offer-generation.persist"
  | "product-offer-generation.list";

export const PRODUCT_OFFER_GENERATION_CAPABILITIES: readonly ProductOfferGenerationCapability[] = [
  "product-offer-generation.generate",
  "product-offer-generation.score",
  "product-offer-generation.persist",
  "product-offer-generation.list",
] as const;

export type ProductOfferGenerationModuleContract = {
  moduleId: ProductOfferGenerationModuleId;
  version: string;
  capabilities: readonly ProductOfferGenerationCapability[];
};

export const PRODUCT_OFFER_GENERATION_MODULE_CONTRACT: ProductOfferGenerationModuleContract = {
  moduleId: PRODUCT_OFFER_GENERATION_MODULE_ID,
  version: PRODUCT_OFFER_GENERATION_MODULE_VERSION,
  capabilities: PRODUCT_OFFER_GENERATION_CAPABILITIES,
};

/** Orchestrates product offer generation and persistence. */
export class ProductOfferGenerationModule {
  readonly contract = PRODUCT_OFFER_GENERATION_MODULE_CONTRACT;
  private readonly engine: ProductOfferGenerationEngine;

  constructor(
    private readonly repository: OfferRepository,
    engine?: ProductOfferGenerationEngine,
  ) {
    this.engine = engine ?? new ProductOfferGenerationEngine(repository);
  }

  scoreProductOffer = scoreProductOffer;
  scoreProductOffers = scoreProductOffers;
  scoring = offerScoring;

  generateProductOffer(input: ProductOfferGenerationInput) {
    return this.engine.generateOffer(input);
  }

  async persistProductOffer(
    workspaceId: string,
    input: ProductOfferGenerationInput,
  ): Promise<ProductOffer> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async persistProductOffers(
    workspaceId: string,
    brand: OfferBrandInput,
    brandProducts: OfferBrandProductInput[],
    productEntities: OfferProductKnowledgeInput[],
    portfolioConfidence?: number,
  ): Promise<ProductOffer[]> {
    return this.engine.generateAllAndSave(
      workspaceId,
      brand,
      brandProducts,
      productEntities,
      portfolioConfidence,
    );
  }

  async getProductOffer(
    workspaceId: string,
    offerId: string,
  ): Promise<ProductOffer | null> {
    return this.repository.getById(workspaceId, offerId);
  }

  async getOfferByProduct(
    workspaceId: string,
    productId: string,
  ): Promise<ProductOffer | null> {
    return this.repository.getByProduct(workspaceId, productId);
  }

  async listProductOffers(
    workspaceId: string,
    filters: Omit<OfferRepositoryQuery, "workspaceId"> = {},
  ): Promise<ProductOffer[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a product offer generation module with optional custom dependencies. */
export function createProductOfferGenerationModule(
  repository: OfferRepository = createInMemoryOfferRepository(),
  engine?: ProductOfferGenerationEngine,
): ProductOfferGenerationModule {
  return new ProductOfferGenerationModule(
    repository,
    engine ?? new ProductOfferGenerationEngine(repository),
  );
}

export const productOfferGenerationModule = createProductOfferGenerationModule();

export type {
  ProductOfferGenerationInput,
  OfferBrandInput,
  OfferBrandProductInput,
  OfferProductKnowledgeInput,
};

export { defaultProductOfferGenerationEngine };
