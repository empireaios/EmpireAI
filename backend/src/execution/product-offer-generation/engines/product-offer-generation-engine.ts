import type { ProductOffer } from "../models/product-offer.js";
import type { OfferRepository } from "../repositories/offer-repository.js";
import {
  scoreProductOffer,
  scoreProductOffers,
  type ProductOfferGenerationInput,
} from "../scoring/offer-scoring.js";
import type { OfferBrandInput, OfferBrandProductInput, OfferProductKnowledgeInput } from "../scoring/offer-scoring.js";

/** Converts brand products into sellable offers. */
export class ProductOfferGenerationEngine {
  constructor(private readonly repository: OfferRepository) {}

  generateOffer(input: ProductOfferGenerationInput) {
    return scoreProductOffer(input);
  }

  generateOffers(
    brand: OfferBrandInput,
    brandProducts: OfferBrandProductInput[],
    productEntities: OfferProductKnowledgeInput[],
    portfolioConfidence?: number,
  ) {
    return scoreProductOffers(brand, brandProducts, productEntities, portfolioConfidence);
  }

  async generateAndSave(
    workspaceId: string,
    input: ProductOfferGenerationInput,
  ): Promise<ProductOffer> {
    const breakdown = scoreProductOffer(input);
    return this.repository.save(workspaceId, breakdown);
  }

  async generateAllAndSave(
    workspaceId: string,
    brand: OfferBrandInput,
    brandProducts: OfferBrandProductInput[],
    productEntities: OfferProductKnowledgeInput[],
    portfolioConfidence?: number,
  ): Promise<ProductOffer[]> {
    const breakdowns = scoreProductOffers(
      brand,
      brandProducts,
      productEntities,
      portfolioConfidence,
    );
    const saved: ProductOffer[] = [];
    for (const breakdown of breakdowns) {
      saved.push(await this.repository.save(workspaceId, breakdown));
    }
    return saved;
  }
}

export const defaultProductOfferGenerationEngine = {
  generateOffer: scoreProductOffer,
  generateOffers: scoreProductOffers,
};

export type { ProductOfferGenerationInput };
