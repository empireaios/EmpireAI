import { z } from "zod";

/** Supplier product is INPUT — never the authority. */
export const SupplierProductInputSchema = z.object({
  supplierProductId: z.string().min(1),
  supplierName: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  costPrice: z.number().positive(),
  suggestedRetailPrice: z.number().positive().optional(),
  shippingDays: z.number().int().min(0).optional(),
  marginPercent: z.number().min(0).max(100).optional(),
  imageUrls: z.array(z.string()).default([]),
  attributes: z.record(z.string()).default({}),
  tags: z.array(z.string()).default([]),
});

export type SupplierProductInput = z.infer<typeof SupplierProductInputSchema>;

export const COMMERCIAL_REVIEW_PERSPECTIVES = [
  "customer",
  "marketing",
  "brand",
  "operations",
  "supply_chain",
  "finance",
  "marketplace",
  "product",
  "risk",
] as const;

export type CommercialReviewPerspective = (typeof COMMERCIAL_REVIEW_PERSPECTIVES)[number];

export const commercialReviewPerspectiveResultSchema = z.object({
  perspective: z.enum(COMMERCIAL_REVIEW_PERSPECTIVES),
  displayName: z.string(),
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendations: z.array(z.string()),
  confidence: z.number().min(0).max(100),
});

export const commercialReviewResultSchema = z.object({
  reviewId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  supplierProductId: z.string(),
  perspectives: z.array(commercialReviewPerspectiveResultSchema),
  aggregateScore: z.number().min(0).max(100),
  aggregateConfidence: z.number().min(0).max(100),
  reviewedAt: z.string().datetime({ offset: true }),
});

export type CommercialReviewPerspectiveResult = z.infer<typeof commercialReviewPerspectiveResultSchema>;
export type CommercialReviewResult = z.infer<typeof commercialReviewResultSchema>;

export const PERSPECTIVE_LABELS: Record<CommercialReviewPerspective, string> = {
  customer: "Customer",
  marketing: "Marketing",
  brand: "Brand",
  operations: "Operations",
  supply_chain: "Supply Chain",
  finance: "Finance",
  marketplace: "Marketplace",
  product: "Product",
  risk: "Risk",
};
