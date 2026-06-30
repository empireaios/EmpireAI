import { z } from "zod";
import { PipelineProductSchema, RevenueHealthSchema } from "./revenue-pipeline-core.js";
import { REVENUE_PIPELINE_LIFECYCLE } from "./revenue-state-machine.js";

export const RevenuePipelineDashboardSchema = z.object({
  moduleId: z.literal("grand-king-revenue-pipeline"),
  missionId: z.literal("GKR-001-GKR-010"),
  revenuePipeline: z.array(z.object({ stage: z.number(), label: z.string(), module: z.string().optional() })),
  productsInReview: z.array(PipelineProductSchema),
  awaitingApproval: z.array(PipelineProductSchema),
  readyToPublish: z.array(PipelineProductSchema),
  liveProducts: z.array(PipelineProductSchema),
  scalingProducts: z.array(PipelineProductSchema),
  archivedProducts: z.array(PipelineProductSchema),
  empireRevenueScore: z.number(),
  computedAt: z.string(),
});
export type RevenuePipelineDashboard = z.infer<typeof RevenuePipelineDashboardSchema>;

export const RevenuePipelineMissionSchema = z.object({
  missionId: z.string(),
  type: z.enum([
    "REVENUE_OPPORTUNITY",
    "AWAITING_KING",
    "LOSING_MONEY",
    "READY_TO_SCALE",
    "RECOMMENDED_ARCHIVE",
  ]),
  title: z.string(),
  description: z.string(),
  productId: z.string().optional(),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  confidence: z.number(),
  generatedAt: z.string(),
});
export type RevenuePipelineMission = z.infer<typeof RevenuePipelineMissionSchema>;

export const RevenuePipelineHeadquartersSchema = z.object({
  moduleId: z.literal("grand-king-revenue-pipeline"),
  missionId: z.literal("GKR-001-GKR-010"),
  currentRevenuePipeline: RevenuePipelineDashboardSchema,
  todaysRevenueOpportunities: z.array(RevenuePipelineMissionSchema),
  executiveRecommendations: z.array(z.object({ source: z.string(), title: z.string(), productId: z.string().optional() })),
  awaitingApprovals: z.array(PipelineProductSchema),
  scalingCandidates: z.array(PipelineProductSchema),
  commercialHealth: RevenueHealthSchema,
  empireRevenueScore: z.number(),
  revenueOpportunities: z.array(RevenuePipelineMissionSchema),
  productsAwaitingKing: z.array(PipelineProductSchema),
  productsLosingMoney: z.array(PipelineProductSchema),
  productsReadyToScale: z.array(PipelineProductSchema),
  productsRecommendedForArchive: z.array(PipelineProductSchema),
  computedAt: z.string(),
});
export type RevenuePipelineHeadquarters = z.infer<typeof RevenuePipelineHeadquartersSchema>;

export const SUPPLIER_PLATFORMS = [
  "cj-dropshipping",
  "autods",
  "alibaba",
  "1688",
  "aliexpress",
  "spocket",
  "syncee",
  "salehoo",
] as const;

export type SupplierPlatform = (typeof SUPPLIER_PLATFORMS)[number];

export const SupplierAttachmentPointSchema = z.object({
  platformId: z.string(),
  displayName: z.string(),
  status: z.enum(["ATTACHED", "PLANNED", "UNSUPPORTED"]),
  moduleRef: z.string().optional(),
});
export type SupplierAttachmentPoint = z.infer<typeof SupplierAttachmentPointSchema>;

export const MarketplaceAttachmentPointSchema = z.object({
  marketplaceId: z.string(),
  displayName: z.string(),
  status: z.enum(["ATTACHED", "PLANNED", "UNSUPPORTED"]),
  moduleRef: z.string(),
});
export type MarketplaceAttachmentPoint = z.infer<typeof MarketplaceAttachmentPointSchema>;
