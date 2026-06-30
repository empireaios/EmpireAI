import { z } from "zod";

export const PORTFOLIO_PRIORITIES = ["SCALE", "OPTIMIZE", "INCUBATE", "EXIT"] as const;

export type PortfolioPriority = (typeof PORTFOLIO_PRIORITIES)[number];

/** Portfolio management overview for unlimited companies. */
export type PortfolioManagement = {
  portfolioId: string;
  totalCompanies: number;
  activeCompanies: number;
  totalMonthlyRevenue: number;
  averageHealthScore: number;
  topPerformer: string;
  underperformer: string;
  recommendedPriority: PortfolioPriority;
  capitalAllocationPercent: Record<string, number>;
  currency: string;
  score: number;
  summary: string;
};

export const portfolioManagementSchema = z.object({
  portfolioId: z.string().min(1),
  totalCompanies: z.number().int().min(1),
  activeCompanies: z.number().int().min(0),
  totalMonthlyRevenue: z.number().min(0),
  averageHealthScore: z.number().min(0).max(100),
  topPerformer: z.string().min(1),
  underperformer: z.string().min(1),
  recommendedPriority: z.enum(PORTFOLIO_PRIORITIES),
  capitalAllocationPercent: z.record(z.string(), z.number().min(0).max(100)),
  currency: z.string().min(1),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a PortfolioManagement record shape. */
export function validatePortfolioManagement(value: unknown): PortfolioManagement {
  return portfolioManagementSchema.parse(value);
}
