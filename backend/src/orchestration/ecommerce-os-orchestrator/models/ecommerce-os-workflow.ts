import { z } from "zod";

export const LAUNCH_WORKFLOW_STAGES = [
  "BRAND_CHOSEN",
  "CATEGORY_CHOSEN",
  "RESEARCHING",
  "RECOMMENDATIONS_READY",
  "AWAITING_APPROVAL",
  "APPROVED",
  "PREPARING_ASSETS",
  "READY_TO_LAUNCH",
  "LAUNCHED",
] as const;

export type LaunchWorkflowStage = (typeof LAUNCH_WORKFLOW_STAGES)[number];

export const READINESS_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "READY",
  "BLOCKED",
  "PARTIAL",
] as const;

export type ReadinessStatus = (typeof READINESS_STATUSES)[number];

export const productRecommendationSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  category: z.string(),
  dominationScore: z.number().min(0).max(100),
  expectedRoi: z.number().min(0).max(100),
  margin: z.number().min(0).max(100),
  supplierConfidence: z.number().min(0).max(100),
  shippingConfidence: z.number().min(0).max(100),
  repeatPurchasePotential: z.number().min(0).max(100),
  brandingPotential: z.number().min(0).max(100),
  compositeRank: z.number().min(0).max(100),
  recommendation: z.enum(["APPROVE", "REVIEW", "REJECT"]),
  rationale: z.array(z.string()),
  supplierId: z.string().optional(),
});

export type ProductRecommendation = z.infer<typeof productRecommendationSchema>;

export const launchAssetBundleSchema = z.object({
  brandId: z.string().optional(),
  brandName: z.string().optional(),
  offersPrepared: z.number().int().min(0),
  listingsPrepared: z.number().int().min(0),
  videosPrepared: z.number().int().min(0),
  imagesPrepared: z.number().int().min(0),
  seoPrepared: z.boolean(),
  supplierConnectionPrepared: z.boolean(),
  supplierId: z.string().optional(),
  publishId: z.string().optional(),
  storeId: z.string().optional(),
});

export type LaunchAssetBundle = z.infer<typeof launchAssetBundleSchema>;

export const launchWorkflowRecordSchema = z.object({
  workflowId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  accountType: z.enum(["grand_king", "founder"]).default("grand_king"),
  stage: z.enum(LAUNCH_WORKFLOW_STAGES),
  brandChoice: z.string().min(1),
  category: z.string().min(1),
  recommendations: z.array(productRecommendationSchema).default([]),
  approvedProductIds: z.array(z.string()).default([]),
  assets: launchAssetBundleSchema.default({
    offersPrepared: 0,
    listingsPrepared: 0,
    videosPrepared: 0,
    imagesPrepared: 0,
    seoPrepared: false,
    supplierConnectionPrepared: false,
  }),
  launchStatus: z.enum(["NOT_READY", "READY_TO_LAUNCH", "LAUNCHED"]).default("NOT_READY"),
  readinessBlockers: z.array(z.string()).default([]),
  actor: z.string().optional(),
  correlationId: z.string().optional(),
  metadata: z.record(z.string()).default({}),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type LaunchWorkflowRecord = z.infer<typeof launchWorkflowRecordSchema>;

export type StartLaunchWorkflowInput = {
  workspaceId: string;
  companyId: string;
  brandChoice: string;
  category: string;
  actor?: string;
  correlationId?: string;
  accountType?: "grand_king" | "founder";
};

export type ApproveLaunchProductsInput = {
  workflowId: string;
  productIds: string[];
  actor?: string;
};
