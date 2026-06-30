import { z } from "zod";

/** Brand row displayed on the founder command center dashboard. */
export type DashboardBrandItem = {
  brandId: string;
  brandName: string;
  niche: string;
  confidence: number;
  opportunityId: string;
  productId: string;
};

/** Aggregated brands section for the founder dashboard. */
export type DashboardBrandSection = {
  totalCount: number;
  averageConfidence: number;
  healthScore: number;
  summary: string;
  items: DashboardBrandItem[];
};

export const dashboardBrandItemSchema = z.object({
  brandId: z.string().min(1),
  brandName: z.string().min(1),
  niche: z.string().min(1),
  confidence: z.number().min(0).max(100),
  opportunityId: z.string().min(1),
  productId: z.string().min(1),
});

export const dashboardBrandSectionSchema = z.object({
  totalCount: z.number().int().min(0),
  averageConfidence: z.number().min(0).max(100),
  healthScore: z.number().min(0).max(100),
  summary: z.string().min(1),
  items: z.array(dashboardBrandItemSchema),
});

/** Validates a DashboardBrandSection record shape. */
export function validateDashboardBrandSection(value: unknown): DashboardBrandSection {
  return dashboardBrandSectionSchema.parse(value);
}
