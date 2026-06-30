import { z } from "zod";

import {
  PORTFOLIO_STATES,
  type PortfolioState,
} from "../../opportunity-portfolio/models/opportunity-portfolio.js";

/** Capital allocation row displayed on the founder command center dashboard. */
export type DashboardCapitalItem = {
  allocationId: string;
  productId: string;
  portfolioState: PortfolioState;
  allocationAmount: number;
  allocationPercentage: number;
  confidence: number;
};

/** Aggregated capital allocation section for the founder dashboard. */
export type DashboardCapitalSection = {
  totalCapital: number;
  allocatedCapital: number;
  allocationCount: number;
  healthScore: number;
  summary: string;
  items: DashboardCapitalItem[];
};

export const dashboardCapitalItemSchema = z.object({
  allocationId: z.string().min(1),
  productId: z.string().min(1),
  portfolioState: z.enum(PORTFOLIO_STATES),
  allocationAmount: z.number().min(0),
  allocationPercentage: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
});

export const dashboardCapitalSectionSchema = z.object({
  totalCapital: z.number().min(0),
  allocatedCapital: z.number().min(0),
  allocationCount: z.number().int().min(0),
  healthScore: z.number().min(0).max(100),
  summary: z.string().min(1),
  items: z.array(dashboardCapitalItemSchema),
});

/** Validates a DashboardCapitalSection record shape. */
export function validateDashboardCapitalSection(value: unknown): DashboardCapitalSection {
  return dashboardCapitalSectionSchema.parse(value);
}
