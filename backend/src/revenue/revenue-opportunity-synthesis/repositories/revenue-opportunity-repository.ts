import type {
  RevenueOpportunity,
  RevenueOpportunityCreateInput,
  RevenueOpportunityType,
} from "../models/revenue-opportunity.js";

export type RevenueOpportunityRepositoryQuery = {
  workspaceId: string;
  productId?: string;
  opportunityType?: RevenueOpportunityType;
  minExpectedValue?: number;
  minConfidence?: number;
  limit?: number;
  offset?: number;
};

/** Persists synthesized revenue opportunities. */
export interface RevenueOpportunityRepository {
  save(
    workspaceId: string,
    input: RevenueOpportunityCreateInput,
  ): Promise<RevenueOpportunity>;
  getById(
    workspaceId: string,
    opportunityId: string,
  ): Promise<RevenueOpportunity | null>;
  getByProduct(
    workspaceId: string,
    productId: string,
  ): Promise<RevenueOpportunity | null>;
  list(query: RevenueOpportunityRepositoryQuery): Promise<RevenueOpportunity[]>;
  delete(workspaceId: string, opportunityId: string): Promise<boolean>;
}
