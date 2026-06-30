import type { PortfolioState } from "../models/opportunity-portfolio.js";
import type { OpportunityPortfolio } from "../models/opportunity-portfolio.js";
import type { PortfolioEntry } from "../models/portfolio-entry.js";
import type { PortfolioRepository } from "../repositories/portfolio-repository.js";
import {
  rankPortfolioInputs,
  scorePortfolioEntry,
  type PortfolioRevenueOpportunityInput,
  type PortfolioScoringInput,
} from "../scoring/portfolio-scoring.js";

/** Manages discovered revenue opportunities within a portfolio. */
export class OpportunityPortfolioEngine {
  constructor(private readonly repository: PortfolioRepository) {}

  scoreEntry(revenueOpportunity: PortfolioRevenueOpportunityInput, currentState?: PortfolioState | null) {
    return scorePortfolioEntry({ revenueOpportunity, currentState });
  }

  rankEntries(revenueOpportunities: PortfolioRevenueOpportunityInput[]): ReturnType<typeof rankPortfolioInputs> {
    return rankPortfolioInputs(
      revenueOpportunities.map((revenueOpportunity) => ({ revenueOpportunity })),
    );
  }

  async addOrUpdateEntry(
    workspaceId: string,
    revenueOpportunity: PortfolioRevenueOpportunityInput,
    stateOverride?: PortfolioState,
  ): Promise<PortfolioEntry> {
    const existing = await this.repository.getEntryByRevenueOpportunity(
      workspaceId,
      revenueOpportunity.opportunityId,
    );
    const breakdown = scorePortfolioEntry({
      revenueOpportunity,
      currentState: existing?.state ?? stateOverride ?? null,
    });
    const portfolio = await this.repository.ensurePortfolio(workspaceId);

    return this.repository.saveEntry(workspaceId, {
      portfolioId: portfolio.portfolioId,
      revenueOpportunityId: revenueOpportunity.opportunityId,
      productId: revenueOpportunity.productId,
      opportunityType: revenueOpportunity.opportunityType,
      state: stateOverride ?? breakdown.recommendedState,
      portfolioScore: breakdown.portfolioScore,
      capitalPriority: breakdown.capitalPriority,
      attentionPriority: breakdown.attentionPriority,
      riskLevel: breakdown.riskLevel,
      recommendedState: breakdown.recommendedState,
      signals: breakdown.signals,
    });
  }

  async assignState(
    workspaceId: string,
    entryId: string,
    state: PortfolioState,
  ): Promise<PortfolioEntry | null> {
    const existing = await this.repository.getEntry(workspaceId, entryId);
    if (!existing) {
      return null;
    }

    return this.repository.saveEntry(workspaceId, {
      portfolioId: existing.portfolioId,
      revenueOpportunityId: existing.revenueOpportunityId,
      productId: existing.productId,
      opportunityType: existing.opportunityType,
      state,
      portfolioScore: existing.portfolioScore,
      capitalPriority: existing.capitalPriority,
      attentionPriority: existing.attentionPriority,
      riskLevel: existing.riskLevel,
      recommendedState: existing.recommendedState,
      signals: existing.signals,
    });
  }

  async rankPortfolio(workspaceId: string): Promise<PortfolioEntry[]> {
    return this.repository.listEntries({ workspaceId });
  }

  async getPortfolioSnapshot(workspaceId: string): Promise<OpportunityPortfolio | null> {
    return this.repository.getPortfolio(workspaceId);
  }
}

export const defaultOpportunityPortfolioEngine = {
  scoreEntry: scorePortfolioEntry,
  rankEntries: rankPortfolioInputs,
};

export type { PortfolioScoringInput, PortfolioRevenueOpportunityInput };
