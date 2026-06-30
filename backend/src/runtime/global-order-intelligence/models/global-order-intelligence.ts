import { z } from "zod";

export const orderLifecycleStageSchema = z.object({
  stage: z.string(),
  count: z.number(),
  avgProfitUsd: z.number(),
});

export const orderIntelligenceRecordSchema = z.object({
  pipelineId: z.string(),
  status: z.string(),
  paymentStatus: z.string(),
  supplierStatus: z.string(),
  fulfillmentStatus: z.string(),
  profitUsd: z.number(),
  revenueUsd: z.number(),
  customerEmail: z.string(),
});

export const globalOrderIntelligenceSchema = z.object({
  moduleId: z.literal("global-order-intelligence"),
  missionId: z.literal("REAL-040"),
  workspaceId: z.string(),
  companyId: z.string(),
  source: z.enum(["customer-order-pipeline", "pipeline-derived"]),
  lifecycleStages: z.array(orderLifecycleStageSchema),
  orders: z.array(orderIntelligenceRecordSchema),
  summary: z.object({
    totalOrders: z.number(),
    totalRevenueUsd: z.number(),
    totalProfitUsd: z.number(),
    avgProfitUsd: z.number(),
  }),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type GlobalOrderIntelligence = z.infer<typeof globalOrderIntelligenceSchema>;
