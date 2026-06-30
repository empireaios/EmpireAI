import type { PortfolioState } from "../models/opportunity-portfolio.js";
import type { OpportunityPortfolio } from "../models/opportunity-portfolio.js";
import type { PortfolioEntry, PortfolioEntryCreateInput } from "../models/portfolio-entry.js";

export type PortfolioRepositoryQuery = {
  workspaceId: string;
  state?: PortfolioState;
  productId?: string;
  revenueOpportunityId?: string;
  minPortfolioScore?: number;
  limit?: number;
  offset?: number;
};

/** Persists opportunity portfolios and entries. */
export interface PortfolioRepository {
  ensurePortfolio(workspaceId: string): Promise<OpportunityPortfolio>;
  getPortfolio(workspaceId: string): Promise<OpportunityPortfolio | null>;
  saveEntry(
    workspaceId: string,
    input: PortfolioEntryCreateInput,
  ): Promise<PortfolioEntry>;
  getEntry(workspaceId: string, entryId: string): Promise<PortfolioEntry | null>;
  getEntryByRevenueOpportunity(
    workspaceId: string,
    revenueOpportunityId: string,
  ): Promise<PortfolioEntry | null>;
  listEntries(query: PortfolioRepositoryQuery): Promise<PortfolioEntry[]>;
  deleteEntry(workspaceId: string, entryId: string): Promise<boolean>;
}
