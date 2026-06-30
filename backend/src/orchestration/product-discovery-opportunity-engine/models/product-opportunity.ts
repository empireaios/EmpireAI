import { z } from "zod";

import { MARKETPLACE_IDS } from "../../marketplace-infrastructure-engine/models/marketplace-connection.js";

export const productDiscoveryInputSchema = z.object({
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  brand: z.string().min(1),
  category: z.string().min(1),
  targetMarket: z.string().default("US"),
  budgetCents: z.number().int().min(0).optional(),
  existingSupplierNetwork: z.array(z.string()).default([]),
  accountType: z.enum(["grand_king", "founder"]).default("grand_king"),
  actor: z.string().optional(),
  correlationId: z.string().optional(),
});

export type ProductDiscoveryInput = {
  workspaceId: string;
  companyId: string;
  brand: string;
  category: string;
  targetMarket?: string;
  budgetCents?: number;
  existingSupplierNetwork?: string[];
  accountType?: "grand_king" | "founder";
  actor?: string;
  correlationId?: string;
};

export function normalizeProductDiscoveryInput(input: ProductDiscoveryInput): Required<
  Pick<ProductDiscoveryInput, "targetMarket" | "existingSupplierNetwork" | "accountType">
> &
  ProductDiscoveryInput {
  return productDiscoveryInputSchema.parse(input);
}

export const marketplaceRecommendationSchema = z.object({
  primaryMarketplace: z.enum(MARKETPLACE_IDS),
  secondaryMarketplace: z.enum(MARKETPLACE_IDS).optional(),
  futureExpansionMarketplaces: z.array(z.enum(MARKETPLACE_IDS)),
  reasoning: z.array(z.string()),
});

export type MarketplaceRecommendation = z.infer<typeof marketplaceRecommendationSchema>;

export const supplierAvailabilitySchema = z.object({
  available: z.boolean(),
  supplierId: z.string(),
  supplierName: z.string(),
  confidence: z.number().int().min(0).max(100),
  inExistingNetwork: z.boolean(),
});

export type SupplierAvailability = z.infer<typeof supplierAvailabilitySchema>;

export const productOpportunitySchema = z.object({
  opportunityId: z.string().min(1),
  rank: z.number().int().min(1),
  product: z.object({
    productId: z.string().min(1),
    productName: z.string().min(1),
    category: z.string().min(1),
  }),
  supplierAvailability: supplierAvailabilitySchema,
  estimatedMargin: z.number().min(0).max(100),
  shippingConfidence: z.number().min(0).max(100),
  competitionEstimate: z.number().min(0).max(100),
  dominationScore: z.number().min(0).max(100),
  brandingPotential: z.number().min(0).max(100),
  repeatPurchasePotential: z.number().min(0).max(100),
  marketplaceSuitability: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  expectedRoi: z.number().min(0).max(100),
  marketplaceRecommendation: marketplaceRecommendationSchema,
  recommendedSupplier: z.string(),
  recommendedMarketplace: z.enum(MARKETPLACE_IDS),
  recommendedNextAction: z.string(),
  rationale: z.array(z.string()),
  scoutRecommendation: z.enum(["APPROVE", "REVIEW", "REJECT"]),
});

export type ProductOpportunity = z.infer<typeof productOpportunitySchema>;

export const DISCOVERY_SESSION_STAGES = [
  "BRAND_CHOSEN",
  "CATEGORY_CHOSEN",
  "DISCOVERING",
  "OPPORTUNITIES_READY",
  "AWAITING_APPROVAL",
  "APPROVED",
  "READY_FOR_PRODUCT_BUILD",
] as const;

export type DiscoverySessionStage = (typeof DISCOVERY_SESSION_STAGES)[number];

export const discoverySessionSchema = z.object({
  sessionId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  accountType: z.enum(["grand_king", "founder"]).default("grand_king"),
  stage: z.enum(DISCOVERY_SESSION_STAGES),
  brand: z.string().min(1),
  category: z.string().min(1),
  targetMarket: z.string(),
  budgetCents: z.number().int().min(0).optional(),
  existingSupplierNetwork: z.array(z.string()),
  opportunities: z.array(productOpportunitySchema).default([]),
  approvedOpportunityIds: z.array(z.string()).default([]),
  actor: z.string().optional(),
  correlationId: z.string().optional(),
  metadata: z.record(z.string()).default({}),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type DiscoverySession = z.infer<typeof discoverySessionSchema>;

export const discoveryDashboardSchema = z.object({
  sessionId: z.string().optional(),
  stage: z.enum(DISCOVERY_SESSION_STAGES).optional(),
  topOpportunities: z.array(productOpportunitySchema),
  recommendedNextAction: z.string(),
  computedAt: z.string().datetime({ offset: true }),
});

export type DiscoveryDashboard = z.infer<typeof discoveryDashboardSchema>;
