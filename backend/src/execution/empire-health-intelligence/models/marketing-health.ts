import { z } from "zod";

export const MARKETING_HEALTH_STATUSES = ["HEALTHY", "WARNING", "CRITICAL"] as const;

export type MarketingHealthStatus = (typeof MARKETING_HEALTH_STATUSES)[number];

/** Marketing health monitor snapshot. */
export type MarketingHealth = {
  monitorId: string;
  activeCampaigns: number;
  roas: number;
  costPerAcquisition: number;
  emailOpenRatePercent: number;
  topChannel: string;
  status: MarketingHealthStatus;
  currency: string;
  score: number;
  summary: string;
};

export const marketingHealthSchema = z.object({
  monitorId: z.string().min(1),
  activeCampaigns: z.number().int().min(0),
  roas: z.number().min(0),
  costPerAcquisition: z.number().min(0),
  emailOpenRatePercent: z.number().min(0).max(100),
  topChannel: z.string().min(1),
  status: z.enum(MARKETING_HEALTH_STATUSES),
  currency: z.string().min(1),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a MarketingHealth record shape. */
export function validateMarketingHealth(value: unknown): MarketingHealth {
  return marketingHealthSchema.parse(value);
}
