/**
 * Product Opportunity module contract — highest-opportunity product identification.
 */

import type { BuyerPersonaProfile } from "../../buyer-intelligence/persona-intelligence/contracts/buyer-persona-profile.js";
import type { ProductEntity } from "../../product-knowledge-graph/models/product-entity.js";
import {
  ProductOpportunityEngine,
  defaultProductOpportunityEngine,
} from "../engines/product-opportunity-engine.js";
import type { ProductOpportunity, OpportunityTier } from "../models/product-opportunity.js";
import type { OpportunityRepository } from "../repositories/opportunity-repository.js";
import { createInMemoryOpportunityRepository } from "../repositories/in-memory-opportunity-repository.js";

export const OPPORTUNITY_MODULE_ID = "product-opportunity" as const;
export type OpportunityModuleId = typeof OPPORTUNITY_MODULE_ID;

export const OPPORTUNITY_MODULE_VERSION = "0.1.0" as const;

export type OpportunityCapability =
  | "product-opportunity.evaluate"
  | "product-opportunity.rank-products"
  | "product-opportunity.rank-personas"
  | "product-opportunity.persist"
  | "product-opportunity.list";

export const OPPORTUNITY_CAPABILITIES: readonly OpportunityCapability[] = [
  "product-opportunity.evaluate",
  "product-opportunity.rank-products",
  "product-opportunity.rank-personas",
  "product-opportunity.persist",
  "product-opportunity.list",
] as const;

export type OpportunityModuleContract = {
  moduleId: OpportunityModuleId;
  version: string;
  capabilities: readonly OpportunityCapability[];
};

export const OPPORTUNITY_MODULE_CONTRACT: OpportunityModuleContract = {
  moduleId: OPPORTUNITY_MODULE_ID,
  version: OPPORTUNITY_MODULE_VERSION,
  capabilities: OPPORTUNITY_CAPABILITIES,
};

/** Orchestrates product opportunity evaluation and persistence. */
export class OpportunityModule {
  readonly contract = OPPORTUNITY_MODULE_CONTRACT;

  constructor(
    private readonly repository: OpportunityRepository,
    private readonly engine: ProductOpportunityEngine = defaultProductOpportunityEngine,
  ) {}

  evaluate(persona: BuyerPersonaProfile, product: ProductEntity) {
    return this.engine.evaluate({ persona, product });
  }

  rankProducts(persona: BuyerPersonaProfile, products: ProductEntity[]) {
    return this.engine.rankProductsForPersona(persona, products);
  }

  rankPersonas(product: ProductEntity, personas: BuyerPersonaProfile[]) {
    return this.engine.rankPersonasForProduct(product, personas);
  }

  async persistOpportunity(
    workspaceId: string,
    persona: BuyerPersonaProfile,
    product: ProductEntity,
  ): Promise<ProductOpportunity> {
    const input = this.engine.toOpportunityInput({ persona, product });
    const existing = await this.repository.getByPair(workspaceId, product.id, persona.personaId);

    if (existing) {
      return this.repository.update(workspaceId, existing.id, input);
    }

    return this.repository.create(workspaceId, input);
  }

  async listOpportunities(
    workspaceId: string,
    filters: {
      productId?: string;
      buyerPersonaId?: string;
      opportunityTier?: OpportunityTier;
      minScore?: number;
    } = {},
  ): Promise<ProductOpportunity[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for an opportunity module with optional custom dependencies. */
export function createOpportunityModule(
  repository: OpportunityRepository = createInMemoryOpportunityRepository(),
  engine: ProductOpportunityEngine = defaultProductOpportunityEngine,
): OpportunityModule {
  return new OpportunityModule(repository, engine);
}

export const opportunityModule = createOpportunityModule();
