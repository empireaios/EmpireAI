import { z } from "zod";

/** Revenue tracking metrics displayed on the founder command center dashboard. */
export type DashboardRevenueSection = {
  totalRevenue: number;
  netProfit: number;
  cashAvailable: number;
  pendingAdvertising: number;
  currency: string;
  healthScore: number;
  summary: string;
};

export const dashboardRevenueSectionSchema = z.object({
  totalRevenue: z.number(),
  netProfit: z.number(),
  cashAvailable: z.number(),
  pendingAdvertising: z.number().min(0),
  currency: z.string().min(1),
  healthScore: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a DashboardRevenueSection record shape. */
export function validateDashboardRevenueSection(value: unknown): DashboardRevenueSection {
  return dashboardRevenueSectionSchema.parse(value);
}
