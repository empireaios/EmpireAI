import type {
  ProductOpportunity,
  ProductOpportunityCreateInput,
  ProductOpportunityUpdateInput,
  OpportunityTier,
} from "../models/product-opportunity.js";

export type OpportunityListQuery = {
  workspaceId: string;
  productId?: string;
  buyerPersonaId?: string;
  opportunityTier?: OpportunityTier;
  minScore?: number;
  minConfidence?: number;
  limit?: number;
  offset?: number;
};

/** Persistence contract for product opportunity records. */
export interface OpportunityRepository {
  create(workspaceId: string, input: ProductOpportunityCreateInput): Promise<ProductOpportunity>;
  getById(workspaceId: string, id: string): Promise<ProductOpportunity | null>;
  getByPair(
    workspaceId: string,
    productId: string,
    buyerPersonaId: string,
  ): Promise<ProductOpportunity | null>;
  update(
    workspaceId: string,
    id: string,
    input: ProductOpportunityUpdateInput,
  ): Promise<ProductOpportunity>;
  delete(workspaceId: string, id: string): Promise<boolean>;
  list(query: OpportunityListQuery): Promise<ProductOpportunity[]>;
}
