import { z } from "zod";

export const BRAND_PRODUCT_ROLES = [
  "HERO",
  "SUPPORTING",
  "BUNDLE",
  "EXPERIMENTAL",
] as const;

export type BrandProductRole = (typeof BRAND_PRODUCT_ROLES)[number];

/** Product assigned to a brand with a portfolio role. */
export type BrandProduct = {
  productId: string;
  displayName: string;
  role: BrandProductRole;
  productScore: number;
  supplierMatchScore: number;
  opportunityScore: number;
  relationshipStrength: number;
};

export const brandProductSchema = z.object({
  productId: z.string().min(1),
  displayName: z.string().min(1),
  role: z.enum(BRAND_PRODUCT_ROLES),
  productScore: z.number().min(0).max(100),
  supplierMatchScore: z.number().min(0).max(100),
  opportunityScore: z.number().min(0).max(100),
  relationshipStrength: z.number().min(0).max(100),
});

/** Validates a BrandProduct record shape. */
export function validateBrandProduct(value: unknown): BrandProduct {
  return brandProductSchema.parse(value);
}
