import { z } from "zod";

/** RS-003 — Canonical Amazon listing package (no publishing). */
export const AmazonListingImageSchema = z.object({
  url: z.string().min(1),
  variant: z.enum(["MAIN", "PT01", "PT02", "PT03", "PT04", "PT05", "PT06", "PT07", "PT08", "SWCH"]),
  altText: z.string().optional(),
});

export const AmazonListingAttributeSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
  unit: z.string().optional(),
});

export const AmazonListingComplianceSchema = z.object({
  productSafety: z.boolean().default(false),
  restrictedProduct: z.boolean().default(false),
  hazmat: z.boolean().default(false),
  brandRegistryRequired: z.boolean().default(false),
  categoryApprovalRequired: z.boolean().default(false),
  documentsProvided: z.array(z.string()).default([]),
});

export const AmazonListingPackageInputSchema = z.object({
  sku: z.string().min(1),
  asin: z.string().optional(),
  marketplaceRegion: z.string().min(2),
  title: z.string().min(1).max(200),
  bullets: z.array(z.string().min(1)).min(1).max(5),
  description: z.string().min(1).max(2000),
  searchTerms: z.array(z.string()).default([]),
  category: z.string().min(1),
  brand: z.string().min(1),
  attributes: z.array(AmazonListingAttributeSchema).default([]),
  pricing: z.object({
    currency: z.string().min(3).max(3),
    listPrice: z.number().positive(),
    salePrice: z.number().positive().optional(),
    costOfGoods: z.number().positive().optional(),
  }),
  inventory: z.object({
    quantity: z.number().int().min(0),
    fulfillmentChannel: z.enum(["FBA", "FBM", "BOTH"]).default("FBM"),
    leadTimeDays: z.number().int().min(0).default(0),
  }),
  shipping: z.object({
    weightKg: z.number().positive(),
    lengthCm: z.number().positive(),
    widthCm: z.number().positive(),
    heightCm: z.number().positive(),
    shippingTemplate: z.string().optional(),
  }),
  images: z.array(AmazonListingImageSchema).min(1),
  compliance: AmazonListingComplianceSchema.default({}),
});

export const AmazonListingPackageSchema = AmazonListingPackageInputSchema.extend({
  listingId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  status: z.enum(["DRAFT", "VALIDATED", "READY", "BLOCKED"]),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type AmazonListingPackageInput = z.infer<typeof AmazonListingPackageInputSchema>;
export type AmazonListingPackage = z.infer<typeof AmazonListingPackageSchema>;
