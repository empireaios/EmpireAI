/**
 * Buyer ↔ Product Matching module contract — links M023 personas to M024 products.
 */

import type { BuyerPersonaProfile } from "../../buyer-intelligence/persona-intelligence/contracts/buyer-persona-profile.js";
import type { ProductEntity } from "../../product-knowledge-graph/models/product-entity.js";
import { BuyerProductMatcher, defaultBuyerProductMatcher } from "../matchers/buyer-product-matcher.js";
import type { BuyerProductMatch, MatchTier } from "../models/buyer-product-match.js";
import type { MatchingRepository } from "../repositories/matching-repository.js";
import { createInMemoryMatchingRepository } from "../repositories/in-memory-matching-repository.js";

export const MATCHING_MODULE_ID = "buyer-product-matching" as const;
export type MatchingModuleId = typeof MATCHING_MODULE_ID;

export const MATCHING_MODULE_VERSION = "0.1.0" as const;

export type MatchingCapability =
  | "buyer-product-matching.match.score"
  | "buyer-product-matching.match.persist"
  | "buyer-product-matching.match.list"
  | "buyer-product-matching.match.rank-products"
  | "buyer-product-matching.match.rank-personas";

export const MATCHING_CAPABILITIES: readonly MatchingCapability[] = [
  "buyer-product-matching.match.score",
  "buyer-product-matching.match.persist",
  "buyer-product-matching.match.list",
  "buyer-product-matching.match.rank-products",
  "buyer-product-matching.match.rank-personas",
] as const;

export type MatchingModuleContract = {
  moduleId: MatchingModuleId;
  version: string;
  capabilities: readonly MatchingCapability[];
};

export const MATCHING_MODULE_CONTRACT: MatchingModuleContract = {
  moduleId: MATCHING_MODULE_ID,
  version: MATCHING_MODULE_VERSION,
  capabilities: MATCHING_CAPABILITIES,
};

/** Orchestrates buyer-product matching and persistence. */
export class MatchingModule {
  readonly contract = MATCHING_MODULE_CONTRACT;

  constructor(
    private readonly repository: MatchingRepository,
    private readonly matcher: BuyerProductMatcher = defaultBuyerProductMatcher,
  ) {}

  scoreMatch(persona: BuyerPersonaProfile, product: ProductEntity) {
    return this.matcher.score({ persona, product });
  }

  async matchAndPersist(
    workspaceId: string,
    persona: BuyerPersonaProfile,
    product: ProductEntity,
  ): Promise<BuyerProductMatch> {
    const matchInput = this.matcher.match({ persona, product });
    const existing = await this.repository.getByPair(
      workspaceId,
      matchInput.buyerPersonaId,
      matchInput.productId,
    );

    if (existing) {
      return this.repository.update(workspaceId, existing.id, matchInput);
    }

    return this.repository.create(workspaceId, matchInput);
  }

  async listMatches(
    workspaceId: string,
    filters: {
      buyerPersonaId?: string;
      productId?: string;
      matchTier?: MatchTier;
      minScore?: number;
    } = {},
  ): Promise<BuyerProductMatch[]> {
    return this.repository.list({
      workspaceId,
      ...filters,
    });
  }

  rankProductsForPersona(persona: BuyerPersonaProfile, products: ProductEntity[]) {
    return this.matcher.rankProductsForPersona(persona, products);
  }

  rankPersonasForProduct(product: ProductEntity, personas: BuyerPersonaProfile[]) {
    return this.matcher.rankPersonasForProduct(product, personas);
  }
}

/** Factory for a matching module with optional custom dependencies. */
export function createMatchingModule(
  repository: MatchingRepository = createInMemoryMatchingRepository(),
  matcher: BuyerProductMatcher = defaultBuyerProductMatcher,
): MatchingModule {
  return new MatchingModule(repository, matcher);
}

export const matchingModule = createMatchingModule();
