import { z } from "zod";

/** Campaign row displayed on the founder command center dashboard. */
export type DashboardCampaignItem = {
  campaignId: string;
  campaignName: string;
  brandId: string;
  platformCount: number;
  adAngleCount: number;
  confidence: number;
};

/** Aggregated campaigns section for the founder dashboard. */
export type DashboardCampaignSection = {
  totalCount: number;
  averageConfidence: number;
  healthScore: number;
  summary: string;
  items: DashboardCampaignItem[];
};

export const dashboardCampaignItemSchema = z.object({
  campaignId: z.string().min(1),
  campaignName: z.string().min(1),
  brandId: z.string().min(1),
  platformCount: z.number().int().min(0),
  adAngleCount: z.number().int().min(0),
  confidence: z.number().min(0).max(100),
});

export const dashboardCampaignSectionSchema = z.object({
  totalCount: z.number().int().min(0),
  averageConfidence: z.number().min(0).max(100),
  healthScore: z.number().min(0).max(100),
  summary: z.string().min(1),
  items: z.array(dashboardCampaignItemSchema),
});

/** Validates a DashboardCampaignSection record shape. */
export function validateDashboardCampaignSection(value: unknown): DashboardCampaignSection {
  return dashboardCampaignSectionSchema.parse(value);
}
