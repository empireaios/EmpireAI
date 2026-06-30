import { z } from "zod";

import {
  REVENUE_OPPORTUNITY_TYPES,
  type RevenueOpportunityType,
} from "../../revenue-opportunity-synthesis/models/revenue-opportunity.js";
import {
  PORTFOLIO_STATES,
  type PortfolioState,
} from "./opportunity-portfolio.js";
import { portfolioSignalSchema, type PortfolioSignal } from "./portfolio-signal.js";

export type PortfolioEntryId = string;

export const PRIORITY_LEVELS = ["HIGH", "MEDIUM", "LOW"] as const;
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

export const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

/** Managed revenue opportunity within a portfolio. */
export type PortfolioEntry = {
  entryId: PortfolioEntryId;
  portfolioId: string;
  workspaceId: string;
  revenueOpportunityId: string;
  productId: string;
  opportunityType: RevenueOpportunityType;
  state: PortfolioState;
  portfolioScore: number;
  capitalPriority: PriorityLevel;
  attentionPriority: PriorityLevel;
  riskLevel: RiskLevel;
  recommendedState: PortfolioState;
  signals: PortfolioSignal[];
  createdAt: string;
  updatedAt: string;
};

export type PortfolioEntryCreateInput = Omit<
  PortfolioEntry,
  "entryId" | "workspaceId" | "createdAt" | "updatedAt"
>;

export const portfolioEntrySchema = z.object({
  entryId: z.string().min(1),
  portfolioId: z.string().min(1),
  workspaceId: z.string().min(1),
  revenueOpportunityId: z.string().min(1),
  productId: z.string().min(1),
  opportunityType: z.enum(REVENUE_OPPORTUNITY_TYPES),
  state: z.enum(PORTFOLIO_STATES),
  portfolioScore: z.number().min(0).max(100),
  capitalPriority: z.enum(PRIORITY_LEVELS),
  attentionPriority: z.enum(PRIORITY_LEVELS),
  riskLevel: z.enum(RISK_LEVELS),
  recommendedState: z.enum(PORTFOLIO_STATES),
  signals: z.array(portfolioSignalSchema),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

/** Validates a PortfolioEntry record shape. */
export function validatePortfolioEntry(value: unknown): PortfolioEntry {
  return portfolioEntrySchema.parse(value);
}
