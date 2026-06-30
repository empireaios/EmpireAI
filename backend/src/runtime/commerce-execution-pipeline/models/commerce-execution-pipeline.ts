import { z } from "zod";

/** REAL-006 — Commerce execution pipeline stages. */
export const COMMERCE_EXECUTION_STAGES = [
  "SUPPLIER",
  "PRODUCT_INTELLIGENCE",
  "LISTING_INTELLIGENCE",
  "MEDIA_INTELLIGENCE",
  "EXECUTIVE_COUNCIL",
  "SOUL",
  "GRAND_KING_APPROVAL",
  "MARKETPLACE_PUBLISHING",
  "MARKETPLACE_SYNCHRONIZATION",
  "MONITORING",
  "SCALING",
  "ARCHIVE",
] as const;

export type CommerceExecutionStage = (typeof COMMERCE_EXECUTION_STAGES)[number];

export const pipelineStageRecordSchema = z.object({
  stage: z.enum(COMMERCE_EXECUTION_STAGES),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETE", "BLOCKED", "ROLLED_BACK"]),
  confidence: z.number().min(0).max(100),
  startedAt: z.string().datetime({ offset: true }).nullable(),
  completedAt: z.string().datetime({ offset: true }).nullable(),
  blockers: z.array(z.string()),
  auditRef: z.string().optional(),
  rollbackAvailable: z.boolean(),
});

export const commerceExecutionPipelineSchema = z.object({
  pipelineId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  productId: z.string(),
  supplierProductId: z.string(),
  currentStage: z.enum(COMMERCE_EXECUTION_STAGES),
  stages: z.array(pipelineStageRecordSchema),
  overallConfidence: z.number().min(0).max(100),
  revenueReadinessPercent: z.number().min(0).max(100),
  architectureComplete: z.boolean(),
  computedAt: z.string().datetime({ offset: true }),
});

export type CommerceExecutionPipeline = z.infer<typeof commerceExecutionPipelineSchema>;
