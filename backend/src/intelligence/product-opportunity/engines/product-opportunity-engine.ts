import type { BuyerPersonaProfile } from "../../buyer-intelligence/persona-intelligence/contracts/buyer-persona-profile.js";
import type { ProductEntity } from "../../product-knowledge-graph/models/product-entity.js";
import type { ProductOpportunityCreateInput } from "../models/product-opportunity.js";
import {
  scoreProductOpportunity,
  type OpportunityScoreBreakdown,
} from "../scoring/opportunity-scoring.js";

export type ProductOpportunityEvaluationInput = {
  persona: BuyerPersonaProfile;
  product: ProductEntity;
};

/** Evaluates and ranks product opportunities from combined buyer intelligence inputs. */
export class ProductOpportunityEngine {
  evaluate(input: ProductOpportunityEvaluationInput): OpportunityScoreBreakdown {
    return scoreProductOpportunity(input.persona, input.product);
  }

  toOpportunityInput(input: ProductOpportunityEvaluationInput): ProductOpportunityCreateInput {
    const breakdown = this.evaluate(input);
    return {
      productId: input.product.id,
      buyerPersonaId: input.persona.personaId,
      opportunityScore: breakdown.opportunityScore,
      opportunityTier: breakdown.opportunityTier,
      confidence: breakdown.confidence,
      reasoning: breakdown.reasoning,
      strengths: breakdown.strengths,
      weaknesses: breakdown.weaknesses,
      recommendedChannels: breakdown.recommendedChannels,
      signals: breakdown.signals,
    };
  }

  rankProductsForPersona(
    persona: BuyerPersonaProfile,
    products: ProductEntity[],
  ): Array<ProductOpportunityCreateInput & { productId: string }> {
    return products
      .map((product) => this.toOpportunityInput({ persona, product }))
      .sort(
        (left, right) =>
          right.opportunityScore - left.opportunityScore || right.confidence - left.confidence,
      );
  }

  findBestOpportunity(
    persona: BuyerPersonaProfile,
    products: ProductEntity[],
  ): ProductOpportunityCreateInput | null {
    const ranked = this.rankProductsForPersona(persona, products);
    return ranked[0] ?? null;
  }

  rankPersonasForProduct(
    product: ProductEntity,
    personas: BuyerPersonaProfile[],
  ): Array<ProductOpportunityCreateInput & { buyerPersonaId: string }> {
    return personas
      .map((persona) => this.toOpportunityInput({ persona, product }))
      .sort(
        (left, right) =>
          right.opportunityScore - left.opportunityScore || right.confidence - left.confidence,
      );
  }
}

export const defaultProductOpportunityEngine = new ProductOpportunityEngine();
