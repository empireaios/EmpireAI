import type { BrandProfile, BrandProfileCreateInput } from "../models/brand-profile.js";

export type BrandRepositoryQuery = {
  workspaceId: string;
  opportunityId?: string;
  productId?: string;
  minConfidence?: number;
  limit?: number;
  offset?: number;
};

/** Persists generated brand profiles. */
export interface BrandRepository {
  save(workspaceId: string, input: BrandProfileCreateInput): Promise<BrandProfile>;
  getById(workspaceId: string, brandId: string): Promise<BrandProfile | null>;
  getByOpportunity(
    workspaceId: string,
    opportunityId: string,
  ): Promise<BrandProfile | null>;
  list(query: BrandRepositoryQuery): Promise<BrandProfile[]>;
  delete(workspaceId: string, brandId: string): Promise<boolean>;
}
