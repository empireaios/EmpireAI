/**
 * Revenue Opportunity Synthesis module — converts Eye intelligence into business opportunities.
 */

import {
  RevenueOpportunitySynthesisEngine,
  defaultRevenueOpportunitySynthesisEngine,
} from "../engines/revenue-opportunity-synthesis-engine.js";
import type { RevenueOpportunity } from "../models/revenue-opportunity.js";
import {
  revenueOpportunityScoring,
  scoreRevenueOpportunity,
  type RevenueOpportunitySynthesisInput,
  type RevenueForecastInput,
  type RevenueLaunchDecisionInput,
  type RevenueLearningInput,
  type RevenueOpportunityInput,
  type RevenueTrustInput,
} from "../scoring/revenue-opportunity-scoring.js";
import type {
  RevenueOpportunityRepository,
  RevenueOpportunityRepositoryQuery,
} from "../repositories/revenue-opportunity-repository.js";
import { createInMemoryRevenueOpportunityRepository } from "../repositories/in-memory-revenue-opportunity-repository.js";

export const REVENUE_OPPORTUNITY_SYNTHESIS_MODULE_ID =
  "revenue-opportunity-synthesis" as const;
export type RevenueOpportunitySynthesisModuleId =
  typeof REVENUE_OPPORTUNITY_SYNTHESIS_MODULE_ID;

export const REVENUE_OPPORTUNITY_SYNTHESIS_MODULE_VERSION = "0.1.0" as const;

export type RevenueOpportunitySynthesisCapability =
  | "revenue-opportunity-synthesis.synthesize"
  | "revenue-opportunity-synthesis.score"
  | "revenue-opportunity-synthesis.persist"
  | "revenue-opportunity-synthesis.list";

export const REVENUE_OPPORTUNITY_SYNTHESIS_CAPABILITIES: readonly RevenueOpportunitySynthesisCapability[] =
  [
    "revenue-opportunity-synthesis.synthesize",
    "revenue-opportunity-synthesis.score",
    "revenue-opportunity-synthesis.persist",
    "revenue-opportunity-synthesis.list",
  ] as const;

export type RevenueOpportunitySynthesisModuleContract = {
  moduleId: RevenueOpportunitySynthesisModuleId;
  version: string;
  capabilities: readonly RevenueOpportunitySynthesisCapability[];
};

export const REVENUE_OPPORTUNITY_SYNTHESIS_MODULE_CONTRACT: RevenueOpportunitySynthesisModuleContract =
  {
    moduleId: REVENUE_OPPORTUNITY_SYNTHESIS_MODULE_ID,
    version: REVENUE_OPPORTUNITY_SYNTHESIS_MODULE_VERSION,
    capabilities: REVENUE_OPPORTUNITY_SYNTHESIS_CAPABILITIES,
  };

/** Orchestrates revenue opportunity synthesis and persistence. */
export class RevenueOpportunityModule {
  readonly contract = REVENUE_OPPORTUNITY_SYNTHESIS_MODULE_CONTRACT;
  private readonly engine: RevenueOpportunitySynthesisEngine;

  constructor(
    private readonly repository: RevenueOpportunityRepository,
    engine?: RevenueOpportunitySynthesisEngine,
  ) {
    this.engine =
      engine ?? new RevenueOpportunitySynthesisEngine(repository);
  }

  scoreRevenueOpportunity = scoreRevenueOpportunity;
  scoring = revenueOpportunityScoring;

  synthesizeRevenueOpportunity(input: RevenueOpportunitySynthesisInput) {
    return this.engine.synthesize(input);
  }

  async persistRevenueOpportunity(
    workspaceId: string,
    input: RevenueOpportunitySynthesisInput,
  ): Promise<RevenueOpportunity> {
    return this.engine.synthesizeAndSave(workspaceId, input);
  }

  async getRevenueOpportunity(
    workspaceId: string,
    opportunityId: string,
  ): Promise<RevenueOpportunity | null> {
    return this.repository.getById(workspaceId, opportunityId);
  }

  async getRevenueOpportunityByProduct(
    workspaceId: string,
    productId: string,
  ): Promise<RevenueOpportunity | null> {
    return this.repository.getByProduct(workspaceId, productId);
  }

  async listRevenueOpportunities(
    workspaceId: string,
    filters: Omit<RevenueOpportunityRepositoryQuery, "workspaceId"> = {},
  ): Promise<RevenueOpportunity[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a revenue opportunity module with optional custom dependencies. */
export function createRevenueOpportunityModule(
  repository: RevenueOpportunityRepository = createInMemoryRevenueOpportunityRepository(),
  engine?: RevenueOpportunitySynthesisEngine,
): RevenueOpportunityModule {
  return new RevenueOpportunityModule(
    repository,
    engine ?? new RevenueOpportunitySynthesisEngine(repository),
  );
}

export const revenueOpportunityModule = createRevenueOpportunityModule();

export type {
  RevenueOpportunitySynthesisInput,
  RevenueOpportunityInput,
  RevenueLaunchDecisionInput,
  RevenueForecastInput,
  RevenueTrustInput,
  RevenueLearningInput,
};

export { defaultRevenueOpportunitySynthesisEngine };
