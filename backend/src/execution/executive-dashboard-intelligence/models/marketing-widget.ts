import { z } from "zod";

/** Executive dashboard marketing widget. */
export type MarketingWidget = {
  widgetId: string;
  activeCampaigns: number;
  emailOpenRatePercent: number;
  clickThroughRatePercent: number;
  costPerAcquisition: number;
  topChannel: string;
  currency: string;
  score: number;
  summary: string;
};

export const marketingWidgetSchema = z.object({
  widgetId: z.string().min(1),
  activeCampaigns: z.number().int().min(0),
  emailOpenRatePercent: z.number().min(0).max(100),
  clickThroughRatePercent: z.number().min(0).max(100),
  costPerAcquisition: z.number().min(0),
  topChannel: z.string().min(1),
  currency: z.string().min(1),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a MarketingWidget record shape. */
export function validateMarketingWidget(value: unknown): MarketingWidget {
  return marketingWidgetSchema.parse(value);
}
