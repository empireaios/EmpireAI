import { z } from "zod";

export const customerProfileSchema = z.object({
  customerId: z.string(),
  country: z.string(),
  marketplace: z.string(),
  productsPurchased: z.array(z.string()),
  categories: z.array(z.string()),
  repeatPurchases: z.number().int().nonnegative(),
  buyingFrequency: z.enum(["LOW", "MEDIUM", "HIGH"]),
  priceSensitivity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  refundRatePercent: z.number(),
  shippingToleranceDays: z.number(),
  reviewScore: z.number(),
  lifetimeValueUsd: z.number(),
  satisfactionScore: z.number(),
  evidence: z.string(),
});

export const customerIntelligenceDashboardSchema = z.object({
  moduleId: z.literal("customer-intelligence"),
  missionId: z.literal("REAL-026"),
  workspaceId: z.string(),
  companyId: z.string(),
  totalCustomers: z.number(),
  avgLifetimeValueUsd: z.number(),
  avgSatisfactionScore: z.number(),
  repeatPurchaseRatePercent: z.number(),
  customersByCountry: z.array(z.object({ label: z.string(), count: z.number(), ltvUsd: z.number() })),
  customersByMarketplace: z.array(z.object({ label: z.string(), count: z.number(), ltvUsd: z.number() })),
  customersByCategory: z.array(z.object({ label: z.string(), count: z.number(), ltvUsd: z.number() })),
  profiles: z.array(customerProfileSchema),
  executiveRecommendation: z.string(),
  recommendationEvidence: z.string(),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type CustomerProfile = z.infer<typeof customerProfileSchema>;
export type CustomerIntelligenceDashboard = z.infer<typeof customerIntelligenceDashboardSchema>;
