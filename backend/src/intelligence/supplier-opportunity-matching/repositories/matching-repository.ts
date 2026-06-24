import type {
  SupplierOpportunityMatch,
  SupplierOpportunityMatchCreateInput,
  SupplierOpportunityMatchUpdateInput,
  SupplierMatchTier,
} from "../models/supplier-opportunity-match.js";

export type SupplierOpportunityMatchingListQuery = {
  workspaceId: string;
  supplierId?: string;
  productId?: string;
  opportunityId?: string;
  matchTier?: SupplierMatchTier;
  minScore?: number;
  minConfidence?: number;
  limit?: number;
  offset?: number;
};

/** Persistence contract for supplier-opportunity match records. */
export interface MatchingRepository {
  create(
    workspaceId: string,
    input: SupplierOpportunityMatchCreateInput,
  ): Promise<SupplierOpportunityMatch>;
  getById(workspaceId: string, id: string): Promise<SupplierOpportunityMatch | null>;
  getByTriple(
    workspaceId: string,
    supplierId: string,
    productId: string,
    opportunityId: string,
  ): Promise<SupplierOpportunityMatch | null>;
  update(
    workspaceId: string,
    id: string,
    input: SupplierOpportunityMatchUpdateInput,
  ): Promise<SupplierOpportunityMatch>;
  delete(workspaceId: string, id: string): Promise<boolean>;
  list(query: SupplierOpportunityMatchingListQuery): Promise<SupplierOpportunityMatch[]>;
}
