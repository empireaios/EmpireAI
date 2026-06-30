/**
 * Opportunity Portfolio module — manages which revenue opportunities deserve resources.
 */

import {
  OpportunityPortfolioEngine,
  defaultOpportunityPortfolioEngine,
  type PortfolioRevenueOpportunityInput,
} from "../engines/opportunity-portfolio-engine.js";
import type { PortfolioState } from "../models/opportunity-portfolio.js";
import type { OpportunityPortfolio } from "../models/opportunity-portfolio.js";
import type { PortfolioEntry } from "../models/portfolio-entry.js";
import {
  portfolioScoring,
  scorePortfolioEntry,
} from "../scoring/portfolio-scoring.js";
import type {
  PortfolioRepository,
  PortfolioRepositoryQuery,
} from "../repositories/portfolio-repository.js";
import { createInMemoryPortfolioRepository } from "../repositories/in-memory-portfolio-repository.js";

export const OPPORTUNITY_PORTFOLIO_MODULE_ID = "opportunity-portfolio" as const;
export type OpportunityPortfolioModuleId = typeof OPPORTUNITY_PORTFOLIO_MODULE_ID;

export const OPPORTUNITY_PORTFOLIO_MODULE_VERSION = "0.1.0" as const;

export type OpportunityPortfolioCapability =
  | "opportunity-portfolio.add"
  | "opportunity-portfolio.rank"
  | "opportunity-portfolio.assign"
  | "opportunity-portfolio.score"
  | "opportunity-portfolio.persist"
  | "opportunity-portfolio.list";

export const OPPORTUNITY_PORTFOLIO_CAPABILITIES: readonly OpportunityPortfolioCapability[] = [
  "opportunity-portfolio.add",
  "opportunity-portfolio.rank",
  "opportunity-portfolio.assign",
  "opportunity-portfolio.score",
  "opportunity-portfolio.persist",
  "opportunity-portfolio.list",
] as const;

export type OpportunityPortfolioModuleContract = {
  moduleId: OpportunityPortfolioModuleId;
  version: string;
  capabilities: readonly OpportunityPortfolioCapability[];
};

export const OPPORTUNITY_PORTFOLIO_MODULE_CONTRACT: OpportunityPortfolioModuleContract = {
  moduleId: OPPORTUNITY_PORTFOLIO_MODULE_ID,
  version: OPPORTUNITY_PORTFOLIO_MODULE_VERSION,
  capabilities: OPPORTUNITY_PORTFOLIO_CAPABILITIES,
};

/** Orchestrates portfolio scoring, ranking, and state management. */
export class OpportunityPortfolioModule {
  readonly contract = OPPORTUNITY_PORTFOLIO_MODULE_CONTRACT;
  private readonly engine: OpportunityPortfolioEngine;

  constructor(
    private readonly repository: PortfolioRepository,
    engine?: OpportunityPortfolioEngine,
  ) {
    this.engine = engine ?? new OpportunityPortfolioEngine(repository);
  }

  scorePortfolioEntry = scorePortfolioEntry;
  scoring = portfolioScoring;

  async addPortfolioEntry(
    workspaceId: string,
    revenueOpportunity: PortfolioRevenueOpportunityInput,
    stateOverride?: PortfolioState,
  ): Promise<PortfolioEntry> {
    return this.engine.addOrUpdateEntry(workspaceId, revenueOpportunity, stateOverride);
  }

  rankPortfolioEntries(workspaceId: string): Promise<PortfolioEntry[]> {
    return this.engine.rankPortfolio(workspaceId);
  }

  rankRevenueOpportunities(revenueOpportunities: PortfolioRevenueOpportunityInput[]) {
    return this.engine.rankEntries(revenueOpportunities);
  }

  async assignPortfolioState(
    workspaceId: string,
    entryId: string,
    state: PortfolioState,
  ): Promise<PortfolioEntry | null> {
    return this.engine.assignState(workspaceId, entryId, state);
  }

  async getPortfolio(workspaceId: string): Promise<OpportunityPortfolio | null> {
    return this.engine.getPortfolioSnapshot(workspaceId);
  }

  async getPortfolioEntry(
    workspaceId: string,
    entryId: string,
  ): Promise<PortfolioEntry | null> {
    return this.repository.getEntry(workspaceId, entryId);
  }

  async listPortfolioEntries(
    workspaceId: string,
    filters: Omit<PortfolioRepositoryQuery, "workspaceId"> = {},
  ): Promise<PortfolioEntry[]> {
    return this.repository.listEntries({ workspaceId, ...filters });
  }
}

/** Factory for an opportunity portfolio module with optional custom dependencies. */
export function createOpportunityPortfolioModule(
  repository: PortfolioRepository = createInMemoryPortfolioRepository(),
  engine?: OpportunityPortfolioEngine,
): OpportunityPortfolioModule {
  return new OpportunityPortfolioModule(
    repository,
    engine ?? new OpportunityPortfolioEngine(repository),
  );
}

export const opportunityPortfolioModule = createOpportunityPortfolioModule();

export type { PortfolioRevenueOpportunityInput, PortfolioState };

export { defaultOpportunityPortfolioEngine };
