import { z } from "zod";

export const COST_CATEGORIES = [
  "HOSTING",
  "STORAGE",
  "DATABASE",
  "REDIS",
  "AI",
  "DEVELOPMENT",
  "MARKETPLACE_FEES",
  "PAYMENT_GATEWAY",
  "ADVERTISING",
  "SUPPLIER",
  "REFUNDS",
  "CHARGEBACKS",
  "SUBSCRIPTIONS",
] as const;

export const costLineItemSchema = z.object({
  category: z.enum(COST_CATEGORIES),
  provider: z.string(),
  label: z.string(),
  monthlyUsd: z.number().nonnegative(),
  recurring: z.boolean(),
  evidence: z.string(),
});

export const empireEconomicsDashboardSchema = z.object({
  moduleId: z.literal("empire-economics"),
  missionId: z.literal("REAL-019"),
  workspaceId: z.string(),
  companyId: z.string(),
  monthlyRecurringRevenueUsd: z.number(),
  monthlyRecurringCostUsd: z.number(),
  grossProfitUsd: z.number(),
  netProfitUsd: z.number(),
  contributionMarginPercent: z.number(),
  cashFlowUsd: z.number(),
  burnRateUsd: z.number(),
  profitForecastUsd: z.number(),
  breakEvenMonths: z.number().nullable(),
  roiPercent: z.number(),
  costBreakdown: z.array(costLineItemSchema),
  revenueBreakdown: z.object({
    marketplaceFeesUsd: z.number(),
    paymentGatewayFeesUsd: z.number(),
    advertisingUsd: z.number(),
    supplierCostsUsd: z.number(),
    refundCostsUsd: z.number(),
    chargebackCostsUsd: z.number(),
  }),
  architectureComplete: z.boolean(),
  liveFeedAttached: z.boolean(),
  computedAt: z.string().datetime({ offset: true }),
});

export type CostLineItem = z.infer<typeof costLineItemSchema>;
export type EmpireEconomicsDashboard = z.infer<typeof empireEconomicsDashboardSchema>;
