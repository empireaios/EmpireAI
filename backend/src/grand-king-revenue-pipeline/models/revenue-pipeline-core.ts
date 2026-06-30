import { z } from "zod";
import { RevenuePipelineStateSchema } from "./revenue-state-machine.js";

export const ProductCandidateInputSchema = z.object({
  title: z.string().min(1),
  category: z.string().optional(),
  supplierPlatform: z.string().optional(),
  supplierProductId: z.string().optional(),
  costPrice: z.number().optional(),
  suggestedRetailPrice: z.number().optional(),
});
export type ProductCandidateInput = z.infer<typeof ProductCandidateInputSchema>;

export const RevenueTimelineEventSchema = z.object({
  eventId: z.string(),
  productId: z.string(),
  eventType: z.string(),
  title: z.string(),
  summary: z.string(),
  sourceModule: z.string().optional(),
  recordedAt: z.string(),
});
export type RevenueTimelineEvent = z.infer<typeof RevenueTimelineEventSchema>;

export const RevenueHealthSchema = z.object({
  commercialHealth: z.number().min(0).max(100),
  listingHealth: z.number().min(0).max(100),
  supplierHealth: z.number().min(0).max(100),
  marketplaceHealth: z.number().min(0).max(100),
  customerHealth: z.number().min(0).max(100),
  profitabilityHealth: z.number().min(0).max(100),
  overallScore: z.number().min(0).max(100),
  computedAt: z.string(),
});
export type RevenueHealth = z.infer<typeof RevenueHealthSchema>;

export const PipelineProductSchema = z.object({
  productId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  title: z.string(),
  category: z.string().optional(),
  supplierPlatform: z.string().optional(),
  supplierProductId: z.string().optional(),
  state: RevenuePipelineStateSchema,
  lifecycleStage: z.string(),
  commercialScore: z.number().optional(),
  kingApproved: z.boolean(),
  marketplaceId: z.string().optional(),
  health: RevenueHealthSchema.optional(),
  timeline: z.array(RevenueTimelineEventSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PipelineProduct = z.infer<typeof PipelineProductSchema>;

export type RevenuePipelineRuntime = {
  moduleId: "grand-king-revenue-pipeline";
  missionId: "GKR-001-GKR-010";
  totalProducts: number;
  byState: Record<string, number>;
  empireRevenueScore: number;
  lastTransitionAt: string | null;
};
