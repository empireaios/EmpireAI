import { z } from "zod";

import {
  PORTFOLIO_STATES,
  type PortfolioState,
} from "../../opportunity-portfolio/models/opportunity-portfolio.js";
import {
  REVENUE_OPPORTUNITY_TYPES,
  type RevenueOpportunityType,
} from "../../revenue-opportunity-synthesis/models/revenue-opportunity.js";

/** Opportunity row displayed on the founder command center dashboard. */
export type DashboardOpportunityItem = {
  entryId: string;
  productId: string;
  opportunityType: RevenueOpportunityType;
  state: PortfolioState;
  portfolioScore: number;
  capitalPriority: string;
  riskLevel: string;
};

/** Aggregated opportunities section for the founder dashboard. */
export type DashboardOpportunitySection = {
  totalCount: number;
  activeCount: number;
  scalingCount: number;
  healthScore: number;
  summary: string;
  items: DashboardOpportunityItem[];
};

export const dashboardOpportunityItemSchema = z.object({
  entryId: z.string().min(1),
  productId: z.string().min(1),
  opportunityType: z.enum(REVENUE_OPPORTUNITY_TYPES),
  state: z.enum(PORTFOLIO_STATES),
  portfolioScore: z.number().min(0).max(100),
  capitalPriority: z.string().min(1),
  riskLevel: z.string().min(1),
});

export const dashboardOpportunitySectionSchema = z.object({
  totalCount: z.number().int().min(0),
  activeCount: z.number().int().min(0),
  scalingCount: z.number().int().min(0),
  healthScore: z.number().min(0).max(100),
  summary: z.string().min(1),
  items: z.array(dashboardOpportunityItemSchema),
});

/** Validates a DashboardOpportunitySection record shape. */
export function validateDashboardOpportunitySection(
  value: unknown,
): DashboardOpportunitySection {
  return dashboardOpportunitySectionSchema.parse(value);
}
