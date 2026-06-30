import { z } from "zod";

export const globalOperationalCommandCenterSchema = z.object({
  moduleId: z.literal("global-operational-command-center"),
  missionId: z.literal("REAL-037"),
  workspaceId: z.string(),
  companyId: z.string(),
  morningBrief: z.string(),
  soulRecommendation: z.string(),
  revenueUsd: z.number(),
  profitUsd: z.number(),
  operationsMode: z.string(),
  completionLedgerSummary: z.object({
    programCount: z.number(),
    avgCompletion: z.number(),
    blockingPrograms: z.number(),
  }),
  countriesActive: z.number(),
  marketplacesConnected: z.number(),
  productsLive: z.number(),
  supplierHealth: z.number(),
  advertisingReady: z.boolean(),
  oarConnected: z.number(),
  oarTotal: z.number(),
  alerts: z.array(z.object({ severity: z.string(), message: z.string() })),
  todaysMissions: z.array(z.string()),
  approvals: z.array(z.object({ id: z.string(), title: z.string() })),
  investigations: z.array(z.string()),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type GlobalOperationalCommandCenter = z.infer<typeof globalOperationalCommandCenterSchema>;
