import type { BuyerPersonaProfile } from "../../buyer-intelligence/persona-intelligence/contracts/buyer-persona-profile.js";
import type { ProductEntity } from "../../product-knowledge-graph/models/product-entity.js";
import type { BuyerProductMatchCreateInput } from "../models/buyer-product-match.js";
import {
  scoreBuyerProductMatch,
  type MatchingScoreBreakdown,
} from "../scoring/matching-scoring.js";

export type BuyerProductMatchInput = {
  persona: BuyerPersonaProfile;
  product: ProductEntity;
};

/** Matches buyer personas to canonical products using deterministic scoring. */
export class BuyerProductMatcher {
  score(input: BuyerProductMatchInput): MatchingScoreBreakdown {
    return scoreBuyerProductMatch(input.persona, input.product);
  }

  match(input: BuyerProductMatchInput): BuyerProductMatchCreateInput {
    const breakdown = this.score(input);
    return {
      buyerPersonaId: input.persona.personaId,
      productId: input.product.id,
      score: breakdown.score,
      confidence: breakdown.confidence,
      matchTier: breakdown.matchTier,
      reasons: breakdown.reasons,
      matchingSignals: breakdown.matchingSignals,
    };
  }

  rankProductsForPersona(
    persona: BuyerPersonaProfile,
    products: ProductEntity[],
  ): Array<BuyerProductMatchCreateInput & { productId: string }> {
    return products
      .map((product) => this.match({ persona, product }))
      .sort((left, right) => right.score - left.score || right.confidence - left.confidence);
  }

  rankPersonasForProduct(
    product: ProductEntity,
    personas: BuyerPersonaProfile[],
  ): Array<BuyerProductMatchCreateInput & { buyerPersonaId: string }> {
    return personas
      .map((persona) => this.match({ persona, product }))
      .sort((left, right) => right.score - left.score || right.confidence - left.confidence);
  }
}

export const defaultBuyerProductMatcher = new BuyerProductMatcher();
