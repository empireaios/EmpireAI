import type { DomainRecommendation } from "../models/domain-recommendation.js";

export type DomainIntelligenceRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  storeId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for domain recommendations. */
export type DomainIntelligenceRepository = {
  save(
    workspaceId: string,
    input: import("../models/domain-recommendation.js").DomainRecommendationCreateInput,
  ): Promise<DomainRecommendation>;
  getById(
    workspaceId: string,
    recommendationId: string,
  ): Promise<DomainRecommendation | null>;
  getByBrand(workspaceId: string, brandId: string): Promise<DomainRecommendation | null>;
  list(query: DomainIntelligenceRepositoryQuery): Promise<DomainRecommendation[]>;
  delete(workspaceId: string, recommendationId: string): Promise<boolean>;
};
