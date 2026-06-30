import { z } from "zod";

import { liveProductRecordSchema } from "../../live-product-intelligence/models/live-product-intelligence.js";
import { globalOpportunitySchema } from "../../global-opportunity-engine/models/global-opportunity-engine.js";
import { revenueImprovementProposalSchema } from "../../revenue-improvement-engine/models/revenue-improvement-engine.js";

const heatmapEntrySchema = z.object({
  label: z.string(),
  code: z.string().optional(),
  score: z.number(),
  revenueUsd: z.number().optional(),
  profitUsd: z.number().optional(),
});

const productQueueItemSchema = z.object({
  productId: z.string(),
  title: z.string(),
  state: z.string().optional(),
  lifecycle: z.string().optional(),
  reason: z.string().optional(),
});

export const globalCommandCenterDashboardSchema = z.object({
  moduleId: z.literal("global-command-center"),
  missionIds: z.tuple([
    z.literal("REAL-013"),
    z.literal("REAL-014"),
    z.literal("REAL-015"),
    z.literal("REAL-016"),
    z.literal("REAL-017"),
    z.literal("REAL-018"),
  ]),
  workspaceId: z.string(),
  companyId: z.string(),
  architecturePercent: z.number(),
  architectureComplete: z.boolean(),
  executiveMorningBrief: z.string(),
  globalRevenueUsd: z.number(),
  globalProfitUsd: z.number(),
  countryHeatMap: z.array(heatmapEntrySchema),
  marketplaceHeatMap: z.array(heatmapEntrySchema),
  productWinners: z.array(liveProductRecordSchema),
  productsAtRisk: z.array(liveProductRecordSchema),
  supplierHealthScore: z.number(),
  supplierInventoryAlerts: z.number(),
  executiveDebateTopic: z.string(),
  soulRecommendation: z.string(),
  grandKingApprovalQueue: z.array(productQueueItemSchema),
  revenueOpportunityQueue: z.array(globalOpportunitySchema),
  revenueImprovementProposals: z.array(revenueImprovementProposalSchema),
  productsAwaitingLaunch: z.array(productQueueItemSchema),
  productsAwaitingImprovement: z.array(productQueueItemSchema),
  productsRecommendedForArchive: z.array(productQueueItemSchema),
  operationalAccess: z.object({
    connected: z.number(),
    totalPlatforms: z.number(),
    blocked: z.number(),
    revenueBlockingGaps: z.number(),
  }),
  completionLedgerSummary: z.object({
    overallPercent: z.number(),
    successMissionProgressPercent: z.number(),
    programsInProgress: z.number(),
  }),
  reusedModules: z.array(z.string()),
  computedAt: z.string().datetime({ offset: true }),
});

export type GlobalCommandCenterDashboard = z.infer<typeof globalCommandCenterDashboardSchema>;
