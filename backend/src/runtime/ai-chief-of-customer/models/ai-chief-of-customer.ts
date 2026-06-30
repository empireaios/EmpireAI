import { z } from "zod";

export const aiChiefOfCustomerDashboardSchema = z.object({
  moduleId: z.literal("ai-chief-of-customer"),
  missionId: z.literal("REAL-033"),
  workspaceId: z.string(),
  companyId: z.string(),
  trustScore: z.number(),
  reviewHealth: z.string(),
  refundRisk: z.string(),
  retentionScore: z.number(),
  experienceScore: z.number(),
  purchaseConfidenceAvg: z.number(),
  customerRecommendations: z.array(z.object({ title: z.string(), evidence: z.string() })),
  recommendOnly: z.literal(true),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type AiChiefOfCustomerDashboard = z.infer<typeof aiChiefOfCustomerDashboardSchema>;
