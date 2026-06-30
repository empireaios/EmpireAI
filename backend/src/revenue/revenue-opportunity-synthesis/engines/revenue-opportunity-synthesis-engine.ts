import type { RevenueOpportunity } from "../models/revenue-opportunity.js";
import type { RevenueOpportunityRepository } from "../repositories/revenue-opportunity-repository.js";
import {
  scoreRevenueOpportunity,
  type RevenueOpportunitySynthesisInput,
} from "../scoring/revenue-opportunity-scoring.js";

/** Converts Eye intelligence inputs into concrete revenue opportunities. */
export class RevenueOpportunitySynthesisEngine {
  constructor(private readonly repository: RevenueOpportunityRepository) {}

  synthesize(input: RevenueOpportunitySynthesisInput) {
    return scoreRevenueOpportunity(input);
  }

  async synthesizeAndSave(
    workspaceId: string,
    input: RevenueOpportunitySynthesisInput,
  ): Promise<RevenueOpportunity> {
    const breakdown = scoreRevenueOpportunity(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultRevenueOpportunitySynthesisEngine = {
  synthesize: scoreRevenueOpportunity,
};
