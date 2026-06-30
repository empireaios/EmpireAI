import { z } from "zod";

export const PORTFOLIO_STATES = [
  "DISCOVERED",
  "WATCHLIST",
  "ACTIVE",
  "SCALING",
  "RETIRED",
] as const;

export type PortfolioState = (typeof PORTFOLIO_STATES)[number];

export type OpportunityPortfolioId = string;

/** Workspace portfolio aggregating managed revenue opportunities. */
export type OpportunityPortfolio = {
  portfolioId: OpportunityPortfolioId;
  workspaceId: string;
  totalEntries: number;
  discoveredCount: number;
  watchlistCount: number;
  activeCount: number;
  scalingCount: number;
  retiredCount: number;
  averagePortfolioScore: number;
  createdAt: string;
  updatedAt: string;
};

export type OpportunityPortfolioCreateInput = Omit<
  OpportunityPortfolio,
  "portfolioId" | "workspaceId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const opportunityPortfolioSchema = z.object({
  portfolioId: z.string().min(1),
  workspaceId: z.string().min(1),
  totalEntries: z.number().int().min(0),
  discoveredCount: z.number().int().min(0),
  watchlistCount: z.number().int().min(0),
  activeCount: z.number().int().min(0),
  scalingCount: z.number().int().min(0),
  retiredCount: z.number().int().min(0),
  averagePortfolioScore: z.number().min(0).max(100),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates an OpportunityPortfolio record shape. */
export function validateOpportunityPortfolio(value: unknown): OpportunityPortfolio {
  return opportunityPortfolioSchema.parse(value);
}

/** Computes portfolio aggregate stats from entry states and scores. */
export function computePortfolioStats(entries: { state: PortfolioState; portfolioScore: number }[]): Omit<
  OpportunityPortfolioCreateInput,
  never
> {
  const counts = {
    discoveredCount: 0,
    watchlistCount: 0,
    activeCount: 0,
    scalingCount: 0,
    retiredCount: 0,
  };

  for (const entry of entries) {
    switch (entry.state) {
      case "DISCOVERED":
        counts.discoveredCount += 1;
        break;
      case "WATCHLIST":
        counts.watchlistCount += 1;
        break;
      case "ACTIVE":
        counts.activeCount += 1;
        break;
      case "SCALING":
        counts.scalingCount += 1;
        break;
      case "RETIRED":
        counts.retiredCount += 1;
        break;
    }
  }

  const averagePortfolioScore =
    entries.length === 0
      ? 0
      : Math.round(
          entries.reduce((total, entry) => total + entry.portfolioScore, 0) / entries.length,
        );

  return {
    totalEntries: entries.length,
    ...counts,
    averagePortfolioScore,
  };
}
